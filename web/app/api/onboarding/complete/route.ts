import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmDrafts, firms, firmUsers, firmSubscriptions, roles, users, subscriptionPlans } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth";
import { PermissionKeys } from "@/lib/rbac/permissions";

const TRIAL_DAYS = 45;
const GB_IN_BYTES = 1024 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const { draftId, name, nameAr, email, phone, address } = await req.json();

        if (!draftId || !name || !email) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Get the draft
        const [draft] = await db
            .select()
            .from(firmDrafts)
            .where(eq(firmDrafts.id, draftId))
            .limit(1);

        if (!draft || draft.ownerId !== userId) {
            return NextResponse.json({ message: "Draft not found" }, { status: 404 });
        }

        // Get the plan
        const [plan] = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, draft.selectedPlanId || ""))
            .limit(1);

        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        // Calculate dates
        const now = new Date();
        const isFree = plan.planType === "free";

        let periodEnd = new Date(now);
        let trialEndsAt = null;
        let status: "trial" | "active" = "active";

        if (isFree) {
            // Free plan - 45 day trial
            trialEndsAt = new Date(now);
            trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
            periodEnd = trialEndsAt;
            status = "trial";
        } else {
            // Paid plan
            const billingPeriod = draft.selectedBillingPeriod || "monthly";
            periodEnd.setMonth(periodEnd.getMonth() + (billingPeriod === "yearly" ? 12 : 1));
        }

        // Calculate storage
        const storagePerUser = plan.storagePerUserGB ?? null;
        const maxStorageBytes = storagePerUser ? String(BigInt(storagePerUser) * BigInt(GB_IN_BYTES)) : null;

        // Create firm
        const firmId = nanoid();
        const tag = nanoid(8);
        const joinCode = nanoid(12);

        await db.insert(firms).values({
            id: firmId,
            name,
            nameAr: nameAr || null,
            email,
            phone: phone || null,
            address: address || null,
            adminId: userId,
            planId: plan.id,
            maxUsers: plan.maxUsers ?? null,
            currentUsers: 1,
            subscriptionStatus: status,
            subscriptionStart: now,
            trialEndsAt,
            maxStorageBytes,
            storageUsedBytes: "0",
            isActive: true,
            createdAt: now,
            updatedAt: now,
            tag,
            joinCode,
        });

        // Create firm subscription record
        await db.insert(firmSubscriptions).values({
            id: nanoid(),
            firmId,
            planId: plan.id,
            status,
            billingPeriod: (draft.selectedBillingPeriod as "monthly" | "yearly") || "monthly",
            seatCount: 1,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialEndsAt,
            createdAt: now,
            updatedAt: now,
        });

        // Create admin role with all permissions
        const roleId = nanoid();
        const allPerms = Object.values(PermissionKeys);
        await db.insert(roles).values({
            id: roleId,
            firmId,
            name: "owner",
            description: "Full access - Owner role",
            permissions: allPerms,
            createdAt: now,
            updatedAt: now,
        });

        // Add user to firm
        await db.insert(firmUsers).values({
            id: nanoid(),
            firmId,
            userId,
            roleId,
            status: "active",
        });

        // Update user with firmId and firmName
        await db.update(users).set({
            firmId,
            firmName: name,
            firmNameAr: nameAr || null,
            updatedAt: now,
        }).where(eq(users.id, userId));

        // Mark draft as completed
        await db.update(firmDrafts).set({
            name,
            nameAr,
            email,
            phone,
            address,
            status: "completed",
            updatedAt: now,
        }).where(eq(firmDrafts.id, draftId));

        return NextResponse.json({ firmId, success: true }, { status: 200 });
    } catch (error) {
        console.error("Complete onboarding error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
