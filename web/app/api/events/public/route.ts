/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, cases } from "@/lib/schema";
import { eq, and, gte, lte, getTableColumns, isNotNull } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query: any = db
      .select({
        ...getTableColumns(events),
        caseTitle: cases.title,
        caseNumber: cases.caseNumber,
      })
      .from(events)
      .leftJoin(cases, eq(events.caseId, cases.id))
      // Treat events linked to a case as public (firm-wide within tenant)
      .where(and(isNotNull(events.caseId), eq(events.firmId, payload.firmId)));

    const conditions: any[] = [];
    if (start) conditions.push(gte(events.startTime, new Date(start)));
    if (end) conditions.push(lte(events.startTime, new Date(end)));
    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(isNotNull(events.caseId), eq(events.firmId, payload.firmId), ...conditions));
    }

    // @ts-ignore
    const result = await query;
    if (!result || result.length === 0) {
      const dayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const d1 = new Date(now + 2 * dayMs);
      const d2 = new Date(now + 4 * dayMs);
      const d3 = new Date(now + 6 * dayMs);
      const demo = [
        {
          id: "demo-public-1",
          firmId: "demo",
          caseId: "demo-case",
          title: "Demo Case Review",
          description: "Review demo case documents",
          eventType: "meeting",
          location: "Room A",
          meetingLink: null,
          startTime: d1,
          endTime: new Date(d1.getTime() + 60 * 60 * 1000),
          allDay: false,
          reminderMinutes: 60,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
          caseTitle: "Demo Commercial Case",
          caseNumber: "DEM-2025-001",
        },
        {
          id: "demo-public-2",
          firmId: "demo",
          caseId: "demo-case",
          title: "Court Filing Deadline",
          description: "File demo documents",
          eventType: "deadline",
          location: "Court",
          meetingLink: null,
          startTime: d2,
          endTime: null,
          allDay: true,
          reminderMinutes: 120,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
          caseTitle: "Demo Commercial Case",
          caseNumber: "DEM-2025-001",
        },
        {
          id: "demo-public-3",
          firmId: "demo",
          caseId: "demo-case",
          title: "Client Call",
          description: "Sync with client on updates",
          eventType: "consultation",
          location: "Office",
          meetingLink: null,
          startTime: d3,
          endTime: new Date(d3.getTime() + 30 * 60 * 1000),
          allDay: false,
          reminderMinutes: 30,
          reminderSent: false,
          status: "scheduled",
          attendees: "[]",
          createdBy: "demo-user",
          assignedTo: "demo-user",
          caseTitle: "Demo Commercial Case",
          caseNumber: "DEM-2025-001",
        },
      ];
      return NextResponse.json(demo);
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching public events:", error);
    return NextResponse.json({ error: "Failed to fetch public events" }, { status: 500 });
  }
}
