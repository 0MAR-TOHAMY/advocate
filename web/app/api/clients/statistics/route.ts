import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getAccessToken } from "@/lib/auth/cookies";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const firmId = payload.firmId;

        // Get total clients count for this firm
        const totalResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(clients as any)
            .where(eq((clients as any).firmId, firmId));
        const totalClients = (totalResult[0] as any)?.count || 0;

        // Get active clients count for this firm
        const activeResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(clients as any)
            .where(
                and(
                    eq((clients as any).firmId, firmId),
                    eq((clients as any).status, "active")
                )
            );
        const activeClients = (activeResult[0] as any)?.count || 0;

        // Get inactive clients count
        const inactiveResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(clients as any)
            .where(
                and(
                    eq((clients as any).firmId, firmId),
                    eq((clients as any).status, "inactive")
                )
            );
        const inactiveClients = (inactiveResult[0] as any)?.count || 0;

        // Get new clients this month for this firm
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const newThisMonthResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(clients as any)
            .where(
                and(
                    eq((clients as any).firmId, firmId),
                    gte((clients as any).createdAt, startOfMonth)
                )
            );
        const newThisMonth = (newThisMonthResult[0] as any)?.count || 0;

        // Get clients by type for this firm
        const byTypeResult = await db
            .select({
                clientType: (clients as any).clientType,
                count: sql<number>`count(*)::int`,
            })
            .from(clients as any)
            .where(eq((clients as any).firmId, firmId))
            .groupBy((clients as any).clientType);

        const clientsByType = (byTypeResult as any[]).reduce((acc, row) => {
            acc[row.clientType] = row.count;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            totalClients,
            activeClients,
            inactiveClients,
            newThisMonth,
            clientsByType,
        });
    } catch (error) {
        console.error("Error fetching client statistics:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
