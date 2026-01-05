import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases } from "@/lib/schema";
import { eq, sql, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/authorize";
import { Permissions } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.CASES_VIEW);

        // Get total cases count
        const [{ totalCases }] = await db
            .select({ totalCases: sql<number>`count(*)::int` })
            .from(cases)
            .where(eq(cases.firmId, user.firmId));

        // Get active cases count
        const [{ activeCases }] = await db
            .select({ activeCases: sql<number>`count(*)::int` })
            .from(cases)
            .where(and(
                eq(cases.firmId, user.firmId),
                eq(cases.status, "active")
            ));

        // Get decided cases count
        const [{ decidedCases }] = await db
            .select({ decidedCases: sql<number>`count(*)::int` })
            .from(cases)
            .where(and(
                eq(cases.firmId, user.firmId),
                eq(cases.status, "decided")
            ));

        // Get closed cases count
        const [{ closedCases }] = await db
            .select({ closedCases: sql<number>`count(*)::int` })
            .from(cases)
            .where(and(
                eq(cases.firmId, user.firmId),
                eq(cases.status, "closed")
            ));

        return NextResponse.json({
            totalCases,
            activeCases,
            decidedCases,
            closedCases,
        });
    } catch (error) {
        console.error("Error fetching case statistics:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
