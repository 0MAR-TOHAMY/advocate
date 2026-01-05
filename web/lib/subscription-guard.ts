/**
 * Subscription Guard Middleware
 * Utility functions to enforce subscription rules on API endpoints
 */

import { db } from "@/lib/db";
import { firms, firmUsers, subscriptionPlans } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "expired" | "read_only";

export interface FirmSubscriptionInfo {
    firmId: string;
    status: SubscriptionStatus;
    planId: string | null;
    maxUsers: number | null;
    currentUsers: number;
    maxStorageBytes: string | null;
    storageUsedBytes: string;
    trialEndsAt: Date | null;
    isReadOnly: boolean;
}

/**
 * Get firm subscription info and limits
 */
export async function getFirmSubscriptionInfo(firmId: string): Promise<FirmSubscriptionInfo | null> {
    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
    if (!firm) return null;

    const status = firm.subscriptionStatus as SubscriptionStatus;
    const isReadOnly = status === "read_only" || status === "expired" || status === "canceled";

    return {
        firmId: firm.id,
        status,
        planId: firm.planId,
        maxUsers: firm.maxUsers,
        currentUsers: firm.currentUsers,
        maxStorageBytes: firm.maxStorageBytes,
        storageUsedBytes: firm.storageUsedBytes || "0",
        trialEndsAt: firm.trialEndsAt,
        isReadOnly,
    };
}

/**
 * Check if firm can perform write operations
 */
export async function canFirmWrite(firmId: string): Promise<{ allowed: boolean; reason?: string }> {
    const info = await getFirmSubscriptionInfo(firmId);
    if (!info) return { allowed: false, reason: "firm_not_found" };

    if (info.isReadOnly) {
        return { allowed: false, reason: "subscription_inactive" };
    }

    // Check if trial has ended
    if (info.status === "trial" && info.trialEndsAt) {
        if (new Date() > info.trialEndsAt) {
            return { allowed: false, reason: "trial_expired" };
        }
    }

    return { allowed: true };
}

/**
 * Check if firm can add new members
 */
export async function canAddMember(firmId: string): Promise<{ allowed: boolean; reason?: string; currentCount?: number; maxCount?: number }> {
    const info = await getFirmSubscriptionInfo(firmId);
    if (!info) return { allowed: false, reason: "firm_not_found" };

    const writeCheck = await canFirmWrite(firmId);
    if (!writeCheck.allowed) return writeCheck;

    // Check user limit
    if (info.maxUsers !== null && info.currentUsers >= info.maxUsers) {
        return {
            allowed: false,
            reason: "user_limit_reached",
            currentCount: info.currentUsers,
            maxCount: info.maxUsers,
        };
    }

    return { allowed: true, currentCount: info.currentUsers, maxCount: info.maxUsers || undefined };
}

/**
 * Check if firm can upload files
 */
export async function canUploadFile(firmId: string, fileSizeBytes: number): Promise<{ allowed: boolean; reason?: string }> {
    const info = await getFirmSubscriptionInfo(firmId);
    if (!info) return { allowed: false, reason: "firm_not_found" };

    const writeCheck = await canFirmWrite(firmId);
    if (!writeCheck.allowed) return writeCheck;

    // Check storage limit
    if (info.maxStorageBytes) {
        const currentUsed = BigInt(info.storageUsedBytes);
        const maxStorage = BigInt(info.maxStorageBytes);
        const newTotal = currentUsed + BigInt(fileSizeBytes);

        if (newTotal > maxStorage) {
            return { allowed: false, reason: "storage_limit_reached" };
        }
    }

    return { allowed: true };
}

/**
 * Update firm storage usage after file upload
 */
export async function updateStorageUsage(firmId: string, bytesToAdd: number): Promise<void> {
    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
    if (!firm) return;

    const currentUsed = BigInt(firm.storageUsedBytes || "0");
    const newUsed = currentUsed + BigInt(bytesToAdd);

    await db.update(firms).set({
        storageUsedBytes: newUsed.toString(),
        updatedAt: new Date(),
    }).where(eq(firms.id, firmId));
}

/**
 * Decrement firm storage usage after file deletion
 */
export async function decrementStorageUsage(firmId: string, bytesToRemove: number): Promise<void> {
    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
    if (!firm) return;

    const currentUsed = BigInt(firm.storageUsedBytes || "0");
    const newUsed = currentUsed - BigInt(bytesToRemove);
    const finalUsed = newUsed < 0n ? 0n : newUsed;

    await db.update(firms).set({
        storageUsedBytes: finalUsed.toString(),
        updatedAt: new Date(),
    }).where(eq(firms.id, firmId));
}

/**
 * Get subscription error message for i18n
 */
export function getSubscriptionErrorKey(reason: string): string {
    const errorKeys: Record<string, string> = {
        firm_not_found: "errors.firmNotFound",
        subscription_inactive: "errors.subscriptionInactive",
        trial_expired: "errors.trialExpired",
        user_limit_reached: "errors.userLimitReached",
        storage_limit_reached: "errors.storageLimitReached",
    };
    return errorKeys[reason] || "errors.unknown";
}
