import { NextRequest, NextResponse } from "next/server";
import { uploadFirmLogo } from "@/lib/cloudinary/upload";
import { db } from "@/lib/db";
import { firms, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { hasStorageSpace } from "@/lib/subscription/guard";

export async function POST(request: NextRequest) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(token);

        const body = await request.json();
        const { fileData, firmId } = body;

        if (!fileData || !firmId) {
            return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
        }

        const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageSettings);
        if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

        // Check storage limit (estimate file size from base64)
        const base64Data = fileData.split(',')[1] || fileData;
        const fileSizeBytes = Math.ceil((base64Data.length * 3) / 4);
        const hasSpace = await hasStorageSpace(firmId, fileSizeBytes);
        if (!hasSpace) {
            try {
                const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
                if (firm) {
                    const { sendStorageLimitWarningEmail } = await import("@/lib/email/service");
                    const { createFirmNotification } = await import("@/lib/notifications/service");
                    const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/subscription`;

                    const [admin] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
                    if (admin) {
                        const usedPercent = Math.round((Number(firm.storageUsedBytes || 0) / Number(firm.maxStorageBytes || 1)) * 100);
                        await sendStorageLimitWarningEmail(admin.email, admin.name || "Admin", firm.name, usedPercent, billingUrl);
                        await createFirmNotification({
                            firmId,
                            type: "billing",
                            title: "Storage Limit Reached",
                            message: `Your firm has reached its storage limit. Please upgrade your plan to upload more files.`,
                            severity: "warning",
                            linkUrl: "/dashboard/subscription"
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to send storage limit notifications:", e);
            }
            return NextResponse.json({ error: "تم بلوغ الحد الأقصى للتخزين" }, { status: 409 });
        }

        const result = await uploadFirmLogo(fileData, firmId);

        await db.update(firms)
            .set({ logoUrl: result.secureUrl, updatedAt: new Date() })
            .where(eq(firms.id, firmId));

        return NextResponse.json({
            message: "تم تحميل الشعار بنجاح",
            url: result.secureUrl,
        });
    } catch (error) {
        console.error("Logo upload error:", error);
        return NextResponse.json({ error: "فشل تحميل الشعار" }, { status: 500 });
    }
}
