import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, firmUsers, firmAddOns, storageAddOns } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

const GB_IN_BYTES = 1024 * 1024 * 1024;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        }

        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        // Verify user belongs to this firm
        if (payload.firmId !== firmId) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
        }

        // Get firm
        const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
        if (!firm) {
            return NextResponse.json({ message: "المكتب غير موجود" }, { status: 404 });
        }

        // Count active members
        const [memberCount] = await db
            .select({ count: count() })
            .from(firmUsers)
            .where(and(eq(firmUsers.firmId, firmId), eq(firmUsers.status, "active")));

        // Get active add-ons for additional storage
        const activeAddOns = await db
            .select({
                id: firmAddOns.id,
                addOnId: firmAddOns.addOnId,
                storageSizeGB: storageAddOns.storageSizeGB,
            })
            .from(firmAddOns)
            .leftJoin(storageAddOns, eq(firmAddOns.addOnId, storageAddOns.id))
            .where(and(eq(firmAddOns.firmId, firmId), eq(firmAddOns.status, "active")));

        // Calculate total additional storage from add-ons
        const additionalStorageGB = activeAddOns.reduce((acc, addon) => acc + (addon.storageSizeGB || 0), 0);
        const additionalStorageBytes = BigInt(additionalStorageGB) * BigInt(GB_IN_BYTES);

        // Calculate storage
        const storageUsedBytes = BigInt(firm.storageUsedBytes || "0");
        const baseStorageBytes = BigInt(firm.maxStorageBytes || "0");
        const totalStorageBytes = baseStorageBytes + additionalStorageBytes;

        // Format bytes for display
        const formatBytes = (bytes: bigint) => {
            const gb = Number(bytes) / GB_IN_BYTES;
            if (gb >= 1) return { value: gb.toFixed(2), unit: "GB" };
            const mb = Number(bytes) / (1024 * 1024);
            return { value: mb.toFixed(2), unit: "MB" };
        };

        const storageUsed = formatBytes(storageUsedBytes);
        const storageTotal = formatBytes(totalStorageBytes);
        const storagePercent = totalStorageBytes > 0n
            ? Math.round(Number((storageUsedBytes * 100n) / totalStorageBytes))
            : 0;

        return NextResponse.json({
            usage: {
                users: {
                    current: memberCount.count,
                    max: firm.maxUsers,
                    percent: firm.maxUsers ? Math.round((memberCount.count / firm.maxUsers) * 100) : 0,
                },
                storage: {
                    usedBytes: storageUsedBytes.toString(),
                    totalBytes: totalStorageBytes.toString(),
                    used: storageUsed,
                    total: storageTotal,
                    percent: storagePercent,
                    additionalGB: additionalStorageGB,
                },
                metrics: {
                    tag: firm.tag,
                },
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Get usage error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}
