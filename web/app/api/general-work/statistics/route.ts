/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generalWork } from "@/lib/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        if (!payload.firmId) {
            return NextResponse.json({ error: "No firm associated with user" }, { status: 403 });
        }

        // Get total work count
        const [{ totalWork }] = await db
            .select({ totalWork: sql<number>`count(*)` })
            .from(generalWork)
            .where(eq(generalWork.firmId, payload.firmId));

        // Get pending work count
        const [{ pendingWork }] = await db
            .select({ pendingWork: sql<number>`count(*)` })
            .from(generalWork)
            .where(and(
                eq(generalWork.firmId, payload.firmId),
                eq(generalWork.status, "pending")
            ));

        // Get in progress work count
        const [{ inProgressWork }] = await db
            .select({ inProgressWork: sql<number>`count(*)` })
            .from(generalWork)
            .where(and(
                eq(generalWork.firmId, payload.firmId),
                eq(generalWork.status, "in_progress")
            ));

        // Get completed this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [{ completedThisMonth }] = await db
            .select({ completedThisMonth: sql<number>`count(*)` })
            .from(generalWork)
            .where(and(
                eq(generalWork.firmId, payload.firmId),
                eq(generalWork.status, "completed"),
                gte(generalWork.completionDate, startOfMonth)
            ));

        return NextResponse.json({
            totalWork: Number(totalWork) || 0,
            pendingWork: Number(pendingWork) || 0,
            inProgressWork: Number(inProgressWork) || 0,
            completedThisMonth: Number(completedThisMonth) || 0,
        });
    } catch (error) {
        console.error("Error fetching general work statistics:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
