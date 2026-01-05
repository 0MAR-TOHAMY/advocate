import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmSubscriptions, subscriptionPlans, firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId || !session.firmId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const firmId = session.firmId;

        // Get subscription
        const [subscription] = await db
            .select()
            .from(firmSubscriptions)
            .where(eq(firmSubscriptions.firmId, firmId))
            .limit(1);

        if (!subscription) {
            return NextResponse.json({ subscription: null, currentPlan: null, usage: null });
        }

        // Get current plan
        const [currentPlan] = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId))
            .limit(1);

        // Get firm for usage data
        const [firm] = await db
            .select()
            .from(firms)
            .where(eq(firms.id, firmId))
            .limit(1);

        const usage = firm ? {
            currentUsers: firm.currentUsers || 1,
            maxUsers: firm.maxUsers,
            storageUsedBytes: firm.storageUsedBytes || "0",
            maxStorageBytes: firm.maxStorageBytes,
        } : null;

        return NextResponse.json({
            subscription: {
                id: subscription.id,
                planId: subscription.planId,
                status: subscription.status,
                billingPeriod: subscription.billingPeriod,
                seatCount: subscription.seatCount,
                currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
                trialEndsAt: subscription.trialEndsAt?.toISOString(),
                downgradeToPlanId: subscription.downgradeToPlanId,
            },
            currentPlan,
            usage,
        });
    } catch (error) {
        console.error("Subscription fetch error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
