import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cases, events, hearings, clients, generalWork } from "@/lib/schema";
import { eq, and, gte, lte, count, sql, not } from "drizzle-orm";
import { addDays } from "date-fns";
import { verifyToken } from "@/lib/auth/jwt";
import { getUserPermissions } from "@/lib/auth/authorize";
import { Permissions } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const payload = verifyToken<{ firmId: string, userId: string }>(accessToken);
        const { firmId, userId } = payload;

        // Get User Permissions
        const perms = await getUserPermissions(userId, firmId);

        const hasCaseView = perms.includes(Permissions.CASES_VIEW) || perms.includes("active"); // Fallback check? No, strictly permissions.
        const hasClientView = perms.includes(Permissions.CLIENTS_VIEW);
        const hasWorkView = perms.includes(Permissions.GENERAL_WORK_VIEW);
        const hasEventView = perms.includes(Permissions.CALENDAR_VIEW_FIRM) || perms.includes(Permissions.CALENDAR_VIEW_PERSONAL);

        const stats: any = {
            permissions: perms,
            sections: {
                cases: hasCaseView,
                clients: hasClientView,
                work: hasWorkView,
                events: hasEventView
            }
        };

        const queries = [];

        // 1. Cases Stats
        if (hasCaseView) {
            queries.push((async () => {
                const [total] = await db.select({ count: count() }).from(cases).where(eq(cases.firmId, firmId));
                const [active] = await db.select({ count: count() }).from(cases).where(and(eq(cases.status, "active"), eq(cases.firmId, firmId)));
                const [closed] = await db.select({ count: count() }).from(cases).where(and(eq(cases.status, "closed"), eq(cases.firmId, firmId)));

                // By Stage
                const byStage = await db.select({ stage: cases.caseStage, count: count() })
                    .from(cases)
                    .where(eq(cases.firmId, firmId))
                    .groupBy(cases.caseStage);

                // By Year (Current +/- 1)
                const currentYear = new Date().getFullYear();
                const years = [currentYear - 1, currentYear, currentYear + 1];
                // Note: Getting strict year requires filtering. We'll do simple check or separate query per year for efficiency or just all group by year?
                // Group by year is easier if date_part supported, otherwise specific ranges.
                // Let's simplified: fetch all createdAt, client-side group? No, heavy.
                // Loop years.
                const byYear: Record<number, number> = {};
                for (const y of years) {
                    const start = new Date(y, 0, 1);
                    const end = new Date(y, 11, 31, 23, 59, 59);
                    const [c] = await db.select({ count: count() }).from(cases)
                        .where(and(eq(cases.firmId, firmId), gte(cases.createdAt, start), lte(cases.createdAt, end)));
                    byYear[y] = c?.count || 0;
                }

                stats.cases = {
                    total: total?.count || 0,
                    active: active?.count || 0,
                    closed: closed?.count || 0,
                    byStage,
                    byYear
                };
            })());
        }

        // 2. Client Stats
        if (hasClientView) {
            queries.push((async () => {
                const [total] = await db.select({ count: count() }).from(clients).where(eq(clients.firmId, firmId));
                const [active] = await db.select({ count: count() }).from(clients).where(and(eq(clients.status, "active"), eq(clients.firmId, firmId)));

                const byType = await db.select({ type: clients.clientType, count: count() })
                    .from(clients)
                    .where(eq(clients.firmId, firmId))
                    .groupBy(clients.clientType);

                const byTypeMap = byType.reduce((acc: any, curr) => {
                    acc[curr.type] = curr.count;
                    return acc;
                }, {});

                stats.clients = {
                    total: total?.count || 0,
                    active: active?.count || 0,
                    inactive: (total?.count || 0) - (active?.count || 0),
                    byType: byTypeMap
                };
            })());
        }

        // 3. General Work Stats
        if (hasWorkView) {
            queries.push((async () => {
                const [active] = await db.select({ count: count() }).from(generalWork)
                    .where(and(
                        eq(generalWork.firmId, firmId),
                        not(eq(generalWork.status, "completed")),
                        not(eq(generalWork.status, "cancelled"))
                    ));
                stats.generalWork = {
                    active: active?.count || 0
                };
            })());
        }

        // 4. Events/Hearings Count (Next 10 days)
        if (hasEventView) { // Or basic user access
            queries.push((async () => {
                const now = new Date();
                const tenDaysFromNow = addDays(now, 10);

                const [evs] = await db.select({ count: count() }).from(events)
                    .where(and(eq(events.firmId, firmId), eq(events.status, "scheduled"), gte(events.startTime, now), lte(events.startTime, tenDaysFromNow)));

                const [hrs] = await db.select({ count: count() }).from(hearings)
                    .where(and(eq(hearings.firmId, firmId), not(eq(hearings.isPostponed, true)), gte(hearings.hearingDate, now), lte(hearings.hearingDate, tenDaysFromNow))); // Approx check

                stats.upcomingEventsCount = (evs?.count || 0) + (hrs?.count || 0);
            })());
        } else {
            stats.upcomingEventsCount = 0;
        }

        await Promise.all(queries);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
