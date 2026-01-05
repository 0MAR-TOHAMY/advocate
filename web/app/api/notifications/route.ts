import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmNotifications } from "@/lib/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = await getAccessToken();
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken<AccessTokenPayload>(token);
        const firmId = payload.firmId;

        if (!firmId) {
            return NextResponse.json({ notifications: [], unreadCount: 0 });
        }

        // Fetch notifications
        const notifications = await db.select()
            .from(firmNotifications as any)
            .where(eq((firmNotifications as any).firmId, firmId))
            .orderBy(desc((firmNotifications as any).createdAt))
            .limit(50) as any[];

        // Count unread
        const unreadCountResult = await db.select({ value: count() })
            .from(firmNotifications as any)
            .where(and(
                eq((firmNotifications as any).firmId, firmId),
                eq((firmNotifications as any).isRead, false)
            )) as any[];

        const unreadCount = Number(unreadCountResult[0]?.value || 0);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Notifications GET error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
