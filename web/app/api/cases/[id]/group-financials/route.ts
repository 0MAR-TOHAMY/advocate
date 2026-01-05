import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, caseExpenses } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAccessToken } from "@/lib/auth/cookies";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";
import { requireResourcePermission } from "@/lib/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id } = await params;

        // Granular Permission Check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", id, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // 1. Get the case to find its group ID
        const [caseData] = await (db.select({
            relatedCaseGroupId: (cases as any).relatedCaseGroupId,
            firmId: (cases as any).firmId
        })
            .from(cases as any)
            .where(eq((cases as any).id, id))
            .limit(1) as any);

        if (!caseData) return NextResponse.json({ error: "Case not found" }, { status: 404 });

        const groupId = caseData.relatedCaseGroupId;

        // If no group ID, only calculate for this case
        const groupCondition = groupId
            ? eq(sql`cases.related_case_group_id`, groupId)
            : eq((cases as any).id, id);

        // 2. Aggregate Case Financials
        // We use raw SQL for sum to handle decimal precision and grouping
        const [caseFinancials] = await (db.select({
            totalClaim: sql<string>`COALESCE(SUM(claim_amount), '0')`,
            totalCollected: sql<string>`COALESCE(SUM(collected_amount), '0')`,
            currency: sql<string>`MAX(currency)`
        })
            .from(cases as any)
            .where(and(groupCondition, eq((cases as any).firmId, payload.firmId))) as any);

        // 3. Aggregate Expenses (only if we have case IDs for the group)
        const caseIdsInGroup = await (db.select({ id: (cases as any).id })
            .from(cases as any)
            .where(and(groupCondition, eq((cases as any).firmId, payload.firmId))) as any);

        const ids = (caseIdsInGroup as any[]).map((c: any) => c.id);

        const [expenseFinancials] = await (db.select({
            totalExpenses: sql<string>`COALESCE(SUM(amount), '0')`
        })
            .from(caseExpenses as any)
            .where(and(
                sql`case_id IN ${ids.length > 0 ? sql`(${sql.join(ids.map(i => sql`${i}`), sql`, `)})` : sql`('')`}`,
                eq((caseExpenses as any).firmId, payload.firmId)
            )) as any);

        return NextResponse.json({
            groupId: groupId || null,
            isGroup: !!groupId,
            totalClaim: parseFloat(caseFinancials.totalClaim),
            totalCollected: parseFloat(caseFinancials.totalCollected),
            totalExpenses: parseFloat(expenseFinancials?.totalExpenses || "0"),
            currency: caseFinancials.currency || "AED",
            caseCount: ids.length
        });

    } catch (error) {
        console.error("Error fetching group financials:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
