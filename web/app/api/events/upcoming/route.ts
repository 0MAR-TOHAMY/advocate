import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, hearings, cases } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { addDays } from "date-fns";
import { verifyToken } from "@/lib/auth/jwt";

import { NextRequest } from "next/server";
export async function GET(req: NextRequest) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        // In Next.js route handlers, use NextRequest to access cookies; but here we keep fallback.
        // Prefer firm scoping only when cookie is available.
        if (!accessToken) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
        const now = new Date();
        const tenDaysFromNow = addDays(now, 10);

        // Fetch Events
        const upcomingEvents = await db.select({
            id: events.id,
            title: events.title,
            startTime: events.startTime,
            eventType: events.eventType,
            status: events.status,
            caseId: events.caseId,
            caseNumber: cases.caseNumber,
        })
            .from(events)
            .leftJoin(cases, eq(events.caseId, cases.id))
            .where(and(
                eq(events.status, "scheduled"),
                gte(events.startTime, now),
                lte(events.startTime, tenDaysFromNow),
                eq(events.firmId, payload.firmId)
            ));

        // Fetch Hearings
        const upcomingHearings = await db.select({
            id: hearings.id,
            title: hearings.stage, // Use stage as title or fallback
            startTime: hearings.hearingDate,
            eventType: hearings.hearingType, // Map to event type
            status: hearings.hasJudgment, // Check if completed
            caseId: hearings.caseId,
            caseNumber: cases.caseNumber,
        })
            .from(hearings)
            .leftJoin(cases, eq(hearings.caseId, cases.id))
            .where(and(
                gte(hearings.hearingDate, now),
                lte(hearings.hearingDate, tenDaysFromNow),
                eq(hearings.firmId, payload.firmId)
            ));

        // Normalize and combine
        const formattedHearings = upcomingHearings.map(h => ({
            ...h,
            title: h.title || 'Court Hearing',
            eventType: 'hearing',
            status: h.status ? 'completed' : 'scheduled',
        })).filter(h => h.status === 'scheduled');

        const allEvents = [...upcomingEvents, ...formattedHearings].sort((a, b) => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

        return NextResponse.json({ events: allEvents });
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
