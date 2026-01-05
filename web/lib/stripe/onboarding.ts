import { db } from "@/lib/db";
import { firms, subscriptionPlans, firmUsers, roles, users, firmSubscriptions, firmDrafts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getRedis } from "@/lib/auth";
import { PermissionKeys } from "@/lib/rbac/permissions";

const TRIAL_DAYS = 45;
const GB_IN_BYTES = 1024 * 1024 * 1024;

export async function finalizeFirmOnboarding(params: {
    sessionId: string;
    userId: string;
    planId: string;
    firmDraftId?: string;
    billingPeriod: "monthly" | "yearly";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}) {
    const { sessionId, userId, planId, firmDraftId, billingPeriod, stripeCustomerId, stripeSubscriptionId } = params;
    const redis = getRedis();

    // 1. Idempotency Check (important for both webhook and success route)
    const idempotencyKey = `onboarding:finalized:session:${sessionId}`;
    if (redis) {
        const alreadyDone = await redis.get(idempotencyKey);
        if (alreadyDone) {
            return { success: true, firmId: alreadyDone };
        }
    }

    // 2. Check if firm already exists for this draft or user
    if (firmDraftId) {
        const [existingFirm] = await db.select().from(firms).where(eq(firms.id, firmDraftId)).limit(1);
        if (existingFirm) {
            if (redis) await redis.set(idempotencyKey, existingFirm.id, "EX", 3600);
            return { success: true, firmId: existingFirm.id };
        }
    }

    // 3. Get plan details
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);

    // 4. Get draft data
    let firmName = "New Firm";
    let firmNameAr = "مكتب جديد";
    let firmEmail = "";
    let firmPhone = "";
    let firmAddress = "";
    let firmLogo = "";

    if (firmDraftId) {
        const [draft] = await db.select().from(firmDrafts).where(eq(firmDrafts.id, firmDraftId)).limit(1);
        if (draft) {
            firmName = draft.name || firmName;
            firmNameAr = draft.nameAr || firmNameAr;
            firmEmail = draft.email || "";
            firmPhone = draft.phone || "";
            firmAddress = draft.address || "";
            firmLogo = draft.logo || "";
        }
    }

    // 5. Create firm ID (using draft ID if available to maintain consistency)
    const firmId = firmDraftId || nanoid();
    const tag = nanoid(8);
    const joinCode = nanoid(12);

    // 6. Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingPeriod === "yearly" ? 12 : 1));

    // 7. Calculate max storage in bytes
    const storagePerUser = plan?.storagePerUserGB ?? null;
    const maxStorageBytes = storagePerUser ? String(BigInt(storagePerUser) * BigInt(GB_IN_BYTES)) : null;

    try {
        await db.transaction(async (tx) => {
            // A. Create firm
            await tx.insert(firms).values({
                id: firmId,
                name: firmName,
                nameAr: firmNameAr,
                email: firmEmail,
                phone: firmPhone,
                address: firmAddress,
                logoUrl: firmLogo,
                adminId: userId,
                planId,
                maxUsers: plan?.maxUsers ?? null,
                currentUsers: 1,
                subscriptionStatus: "active",
                subscriptionStart: now,
                maxStorageBytes,
                storageUsedBytes: "0",
                stripeCustomerId: stripeCustomerId || null,
                stripeSubscriptionId: stripeSubscriptionId || null,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                tag,
                joinCode,
            });

            // B. Create firm subscription record
            await tx.insert(firmSubscriptions).values({
                id: nanoid(),
                firmId,
                planId,
                status: "active",
                billingPeriod,
                seatCount: 1,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                stripeSubscriptionId: stripeSubscriptionId || null,
                stripeCustomerId: stripeCustomerId || null,
                createdAt: now,
                updatedAt: now,
            });

            // C. Create owner role
            const roleId = nanoid();
            const allPerms = Object.values(PermissionKeys);
            await tx.insert(roles).values({
                id: roleId,
                firmId,
                name: "owner",
                description: "Full access - Owner role",
                permissions: allPerms,
                createdAt: now,
                updatedAt: now,
            });

            // D. Add user to firm
            await tx.insert(firmUsers).values({
                id: nanoid(),
                firmId,
                userId,
                roleId,
                status: "active",
            });

            // E. Update user record
            await tx.update(users).set({
                firmId,
                firmName,
                firmNameAr,
                updatedAt: now
            }).where(eq(users.id, userId));

            // F. Mark draft as completed
            if (firmDraftId) {
                await tx.update(firmDrafts).set({
                    status: "completed",
                    updatedAt: now,
                }).where(eq(firmDrafts.id, firmDraftId));
            }
        });

        // 8. Cache result in Redis for Success Route lookup
        if (redis) {
            await redis.set(idempotencyKey, firmId, "EX", 3600);
            await redis.set(`stripe:session:${sessionId}:firmId`, firmId, "EX", 3600);
        }

        return { success: true, firmId };
    } catch (error: any) {
        // If it's a unique constraint error, someone else might have just created it
        if (error.code === '23505') {
            return { success: true, firmId };
        }
        console.error("Finalize onboarding error:", error);
        throw error;
    }
}
