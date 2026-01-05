import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmDrafts, subscriptionPlans, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth";
import { createPlanCheckoutSession, hasUsedFreeTrial, markFreeTrialUsed } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const { planId, billingPeriod = "monthly" } = await req.json();

        if (!planId) {
            return NextResponse.json({ message: "Plan ID required" }, { status: 400 });
        }

        // Get the plan
        const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        const isFree = plan.planType === "free";

        // Check if user already used free trial
        if (isFree) {
            const usedTrial = await hasUsedFreeTrial(userId);
            if (usedTrial) {
                return NextResponse.json({ message: "Free trial already used" }, { status: 400 });
            }
        }

        // Create firm draft
        const draftId = nanoid();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Draft expires in 7 days

        await db.insert(firmDrafts).values({
            id: draftId,
            ownerId: userId,
            selectedPlanId: planId,
            selectedBillingPeriod: billingPeriod,
            status: isFree ? "pending" : "payment_pending",
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // If free plan, mark trial as used and go to firm profile
        if (isFree) {
            await markFreeTrialUsed(userId);
            return NextResponse.json({
                draftId,
                isFree: true,
                checkoutUrl: null,
            });
        }

        // For paid plans, create Stripe checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutResult = await createPlanCheckoutSession({
            planId,
            userId,
            firmDraftId: draftId,
            billingPeriod: billingPeriod as "monthly" | "yearly",
            successUrl: `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/onboarding/plan`,
        });

        if (checkoutResult.type === "checkout" && checkoutResult.url) {
            return NextResponse.json({
                draftId,
                isFree: false,
                checkoutUrl: checkoutResult.url,
            });
        }

        return NextResponse.json({ message: "Failed to create checkout" }, { status: 500 });
    } catch (error: any) {
        console.error("Create draft error:", error);

        // Catch specific Stripe errors for clearer feedback
        if (error?.type === "StripeInvalidRequestError" && error?.raw?.code === "resource_missing") {
            const priceId = error?.raw?.param?.includes("price") ? "missing_price" : "resource_missing";
            return NextResponse.json({
                message: "Stripe configuration error: Price not found in your account.",
                code: priceId,
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
