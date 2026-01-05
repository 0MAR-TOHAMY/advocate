import { db } from "@/lib/db";
import { firms, firmSubscriptions, subscriptionPlans, firmAddOns, storageAddOns } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const GB_IN_BYTES = 1024 * 1024 * 1024;

/**
 * Recalculates and updates a firm's subscription limits (max users and max storage)
 * in the firms table based on their current plan, seats, and active add-ons.
 */
export async function updateFirmLimits(firmId: string) {
    // 1. Get firm and current subscription
    const [subscription] = await db
        .select()
        .from(firmSubscriptions as any)
        .where(eq((firmSubscriptions as any).firmId, firmId))
        .limit(1) as any[];

    if (!subscription) return;

    // 2. Get plan details
    const [plan] = await db
        .select()
        .from(subscriptionPlans as any)
        .where(eq((subscriptionPlans as any).id, subscription.planId))
        .limit(1) as any[];

    if (!plan) return;

    // 3. Calculate Max Users
    const maxUsers = plan.maxUsers || 999;

    // 4. Calculate Max Storage
    // Logic: Base Plan Storage * Seats + sum(Active Add-ons)
    // If plan is unlimited, total is unlimited.
    const seatCount = subscription.seatCount || 1;
    let maxStorageBytes: string | null = null;

    if (plan.storagePerUserGB !== null) {
        const baseStorage = BigInt(plan.storagePerUserGB) * BigInt(GB_IN_BYTES) * BigInt(seatCount);

        // Get All Active Add-ons
        const activeAddOns = await db
            .select({ storageSizeGB: (storageAddOns as any).storageSizeGB })
            .from(firmAddOns as any)
            .leftJoin(storageAddOns as any, eq((firmAddOns as any).addOnId, (storageAddOns as any).id))
            .where(and(
                eq((firmAddOns as any).firmId, firmId),
                eq((firmAddOns as any).status, "active")
            )) as any[];

        let totalAddOnStorage = BigInt(0);
        for (const item of activeAddOns) {
            if (item.storageSizeGB) {
                totalAddOnStorage += BigInt(item.storageSizeGB) * BigInt(GB_IN_BYTES);
            }
        }

        maxStorageBytes = String(baseStorage + totalAddOnStorage);
    }

    // 5. Update firm table
    await db.update(firms as any)
        .set({
            maxUsers,
            maxStorageBytes,
            updatedAt: new Date()
        })
        .where(eq((firms as any).id, firmId));

    return { maxUsers, maxStorageBytes };
}
