import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, caseExpenses, clients, users } from "@/lib/schema";
import { and, eq, sql, desc, gte, lte } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/authorize";
import { Permissions } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.REPORTS_VIEW);

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "summary"; // summary, financials, activity
        const startDateString = searchParams.get("startDate");
        const endDateString = searchParams.get("endDate");
        const assignedTo = searchParams.get("assignedTo");

        if (type === "summary") {
            // General Stats
            const [stats] = await (db.select({
                totalCases: sql<number>`count(${cases.id})`,
                activeCases: sql<number>`count(CASE WHEN ${cases.status} = 'active' THEN 1 END)`,
                closedCases: sql<number>`count(CASE WHEN ${cases.status} = 'closed' THEN 1 END)`,
                decidedCases: sql<number>`count(CASE WHEN ${cases.status} = 'decided' THEN 1 END)`,
                totalClaimAmount: sql<number>`sum(${cases.claimAmount})`,
                totalCollectedAmount: sql<number>`sum(${cases.collectedAmount})`,
            })
                .from(cases as any)
                .where(eq((cases as any).firmId, user.firmId)) as any);

            // Fetch client count separately to avoid nested select issues with Drizzle versions
            const [clientCount] = await (db.select({ count: sql<number>`count(*)` }).from(clients as any).where(eq((clients as any).firmId, user.firmId)) as any);

            return NextResponse.json({
                ...stats,
                totalClients: clientCount.count
            });
        }

        if (type === "financials") {
            // Group by currency and status
            const financialStats = await (db.select({
                currency: (cases as any).currency,
                status: (cases as any).status,
                count: sql<number>`count(*)`,
                totalClaim: sql<number>`sum(${cases.claimAmount})`,
                totalCollected: sql<number>`sum(${cases.collectedAmount})`,
            })
                .from(cases as any)
                .where(eq((cases as any).firmId, user.firmId))
                .groupBy((cases as any).currency, (cases as any).status) as any);

            // Expenses summary
            const [expenses] = await (db.select({
                total: sql<number>`sum(${caseExpenses.amount})`,
            })
                .from(caseExpenses as any)
                .where(eq((caseExpenses as any).firmId, user.firmId)) as any);

            return NextResponse.json({
                financialStats,
                totalExpenses: expenses?.total || 0
            });
        }

        if (type === "workload") {
            // User workload
            const workload = await (db.select({
                userId: (cases as any).assignedTo,
                userName: (users as any).name,
                caseCount: sql<number>`count(*)`,
            })
                .from(cases as any)
                .leftJoin(users as any, eq((cases as any).assignedTo, (users as any).id))
                .where(eq((cases as any).firmId, user.firmId))
                .groupBy((cases as any).assignedTo, (users as any).name) as any);

            return NextResponse.json(workload);
        }

        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
