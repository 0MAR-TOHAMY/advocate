import { NextRequest, NextResponse } from "next/server";
import { putObject } from "@/lib/s3/client";
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

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const firmId = formData.get("firmId") as string;

        if (!file || !firmId) {
            return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
        }

        const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageSettings);
        if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

        // Check storage limit
        const hasSpace = await hasStorageSpace(firmId, file.size);
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

        // Generate S3 Key
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const key = `${firmId}/license/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

        // Upload to S3 (bucket: documents) - using documents bucket for protected access
        await putObject("documents", key, buffer, file.type || "application/pdf");

        // Save Key to DB
        await db.update(firms)
            .set({ licenseUrl: key, updatedAt: new Date() })
            .where(eq(firms.id, firmId));

        return NextResponse.json({
            message: "تم تحميل الرخصة بنجاح",
            url: key, // We return the key, but frontend sees URL in GET
        });
    } catch (error) {
        console.error("License upload error:", error);
        return NextResponse.json({ error: "فشل تحميل الرخصة" }, { status: 500 });
    }
}
