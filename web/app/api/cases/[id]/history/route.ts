import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseHistory, users } from "@/lib/schema";
import { and, eq, desc, sql } from "drizzle-orm";
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
        const { id: caseId } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const offset = (page - 1) * pageSize;

        // Permission check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Get total count
        const totalRes = await (db.select({ count: sql<number>`count(*)` })
            .from(caseHistory as any)
            .where(eq((caseHistory as any).caseId, caseId)) as any);
        const total = Number(totalRes[0]?.count || 0);

        // Join with users to get the name of the person who performed the action
        const data = await (db.select({
            id: (caseHistory as any).id,
            caseId: (caseHistory as any).caseId,
            userId: (caseHistory as any).userId,
            userName: (users as any).name,
            action: (caseHistory as any).action,
            fieldChanged: (caseHistory as any).fieldChanged,
            oldValue: (caseHistory as any).oldValue,
            newValue: (caseHistory as any).newValue,
            notes: (caseHistory as any).notes,
            createdAt: (caseHistory as any).createdAt,
        })
            .from(caseHistory as any)
            .leftJoin(users as any, eq((caseHistory as any).userId, (users as any).id))
            .where(eq((caseHistory as any).caseId, caseId))
            .orderBy(desc((caseHistory as any).createdAt))
            .limit(pageSize)
            .offset(offset) as any);

        return NextResponse.json({ items: data, total });
    } catch (error) {
        console.error("Error fetching case history:", error);
        return NextResponse.json({ error: "Failed to fetch case history" }, { status: 500 });
    }
}
