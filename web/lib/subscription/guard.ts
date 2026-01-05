import { db } from "@/lib/db";
import { firms, firmSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled" | "expired" | "read_only";

/**
 * Checks if a firm is in read-only mode based on its subscription status.
 */
export function isReadOnly(status: SubscriptionStatus): boolean {
    const readOnlyStatuses: SubscriptionStatus[] = ["past_due", "canceled", "expired", "read_only"];
    return readOnlyStatuses.includes(status);
}

/**
 * Gets the current subscription status of a firm.
 */
export async function getFirmSubscriptionStatus(firmId: string): Promise<SubscriptionStatus> {
    const [firm] = await db
        .select({ subscriptionStatus: firms.subscriptionStatus })
        .from(firms)
        .where(eq(firms.id, firmId))
        .limit(1);

    return (firm?.subscriptionStatus as SubscriptionStatus) || "expired";
}

/**
 * Server-side guard to ensure the firm has an active/trial subscription.
 * If not, it can optionally throw or return a response for API routes.
 */
export async function requireActiveSubscription() {
    const session = await getSession();
    if (!session?.firmId) {
        throw new Error("Firm context required");
    }

    const status = await getFirmSubscriptionStatus(session.firmId);

    if (isReadOnly(status)) {
        return {
            allowed: false,
            status,
            errorResponse: NextResponse.json(
                { message: "Subscription restricted. Read-only mode active.", status },
                { status: 403 }
            ),
        };
    }

    return { allowed: true, status };
}

/**
 * Verifies if a firm has enough user seats for a new member.
 */
export async function hasUserSeats(firmId: string): Promise<boolean> {
    const [firm] = await db
        .select({
            currentUsers: firms.currentUsers,
            maxUsers: firms.maxUsers,
        })
        .from(firms)
        .where(eq(firms.id, firmId))
        .limit(1);

    if (!firm) return false;
    if (firm.maxUsers === null) return true; // Unlimited

    return (firm.currentUsers || 0) < firm.maxUsers;
}

/**
 * Verifies if a firm has enough storage space for a new file.
 */
export async function hasStorageSpace(firmId: string, bytesToAdd: number): Promise<boolean> {
    const [firm] = await db
        .select({
            storageUsedBytes: firms.storageUsedBytes,
            maxStorageBytes: firms.maxStorageBytes,
        })
        .from(firms)
        .where(eq(firms.id, firmId))
        .limit(1);

    if (!firm) return false;
    if (firm.maxStorageBytes === null) return true; // Unlimited

    const currentUsed = BigInt(firm.storageUsedBytes || "0");
    const max = BigInt(firm.maxStorageBytes);

    return (currentUsed + BigInt(bytesToAdd)) <= max;
}
