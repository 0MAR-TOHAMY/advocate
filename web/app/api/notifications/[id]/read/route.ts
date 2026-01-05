import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmNotifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken<AccessTokenPayload>(token);
        const firmId = payload.firmId;
        const { id } = await params;

        if (!firmId) {
            return NextResponse.json({ message: "No firm associated" }, { status: 400 });
        }

        await db.update(firmNotifications as any)
            .set({ isRead: true })
            .where(and(
                eq((firmNotifications as any).id, id),
                eq((firmNotifications as any).firmId, firmId)
            ));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notification mark-read error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
