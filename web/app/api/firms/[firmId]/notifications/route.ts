import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmNotifications } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmSettingsView);
        if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

        const notifications = await db.select()
            .from(firmNotifications)
            .where(eq(firmNotifications.firmId, firmId))
            .orderBy(desc(firmNotifications.createdAt))
            .limit(50);

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Notifications error:", error);
        return NextResponse.json({ message: "خطأ في تحميل الإشعارات" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmSettingsView);
        if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

        const { notificationId, markAllRead } = await req.json();

        if (markAllRead) {
            // Mark all as read
            await db.update(firmNotifications)
                .set({ isRead: true })
                .where(eq(firmNotifications.firmId, firmId));
        } else if (notificationId) {
            // Mark single as read
            await db.update(firmNotifications)
                .set({ isRead: true })
                .where(and(
                    eq(firmNotifications.id, notificationId),
                    eq(firmNotifications.firmId, firmId)
                ));
        }

        return NextResponse.json({ message: "تم التحديث" });
    } catch (error) {
        console.error("Notifications update error:", error);
        return NextResponse.json({ message: "خطأ في تحديث الإشعارات" }, { status: 500 });
    }
}
