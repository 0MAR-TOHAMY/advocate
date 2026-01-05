import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, clients, generalWork } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

        const { id: clientId } = await ctx.params;

        // Fetch Cases
        const clientCases = await db.select({
            id: cases.id,
            title: cases.title
        }).from(cases).where(and(eq(cases.clientId, clientId), eq(cases.firmId, payload.firmId)));

        // Fetch Works
        const clientWorks = await db.select({
            id: generalWork.id,
            title: generalWork.title
        }).from(generalWork).where(and(eq(generalWork.clientId, clientId), eq(generalWork.firmId, payload.firmId)));

        return NextResponse.json({
            cases: clientCases,
            works: clientWorks
        });

    } catch (error) {
        console.error("Error fetching content summary:", error);
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }
}
