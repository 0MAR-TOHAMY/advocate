/**
 * Stripe Integration Library
 * Handles all Stripe-related operations for subscriptions
 */

import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptionPlans, storageAddOns, firmSubscriptions, firmDrafts, users, firms } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export { stripe };

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutSessionParams {
  planId: string;
  userId: string;
  firmDraftId: string;
  billingPeriod: "monthly" | "yearly";
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface AddOnCheckoutParams {
  addOnId: string;
  firmId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// ============================================================================
// PLAN CHECKOUT
// ============================================================================

/**
 * Create a Stripe Checkout session for a subscription plan
 */
export async function createPlanCheckoutSession(params: CheckoutSessionParams) {
  const { planId, userId, firmDraftId, billingPeriod, currency = "usd" } = params;

  // Get the plan
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  if (!plan) throw new Error("Plan not found");

  // Free plan doesn't need Stripe checkout
  if (plan.planType === "free") {
    return { type: "free" as const, planId };
  }

  // Get the Stripe price ID based on billing period
  const priceId = billingPeriod === "yearly"
    ? plan.stripePriceIdYearly
    : plan.stripePriceIdMonthly;

  if (!priceId) throw new Error("Stripe price not configured for this plan");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1, // Initial seat count
      },
    ],
    metadata: {
      userId,
      planId,
      firmDraftId,
      billingPeriod,
    },
    success_url: params.successUrl || `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl || `${baseUrl}/onboarding/plan`,
    currency: currency.toLowerCase(),
    allow_promotion_codes: true,
    billing_address_collection: "required",
    customer_email: undefined, // Will be filled by Stripe
  });

  // Update firm draft with session ID
  await db.update(firmDrafts)
    .set({
      stripeSessionId: session.id,
      status: "payment_pending",
      updatedAt: new Date(),
    })
    .where(eq(firmDrafts.id, firmDraftId));

  return { type: "checkout" as const, url: session.url, sessionId: session.id };
}

// ============================================================================
// ADD-ON CHECKOUT
// ============================================================================

/**
 * Create a Stripe Checkout session for a storage add-on
 */
export async function createAddOnCheckoutSession(params: AddOnCheckoutParams) {
  const { addOnId, firmId } = params;

  // Get the add-on
  const [addOn] = await db.select().from(storageAddOns).where(eq(storageAddOns.id, addOnId)).limit(1);
  if (!addOn) throw new Error("Add-on not found");
  if (!addOn.stripePriceId) throw new Error("Stripe price not configured for this add-on");

  // Get firm subscription for customer ID
  const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);
  if (!subscription?.stripeCustomerId) throw new Error("Firm has no Stripe customer");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: subscription.stripeCustomerId,
    line_items: [
      {
        price: addOn.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      firmId,
      addOnId,
      type: "add_on",
    },
    success_url: params.successUrl || `${baseUrl}/dashboard/subscription?success=addon`,
    cancel_url: params.cancelUrl || `${baseUrl}/dashboard/subscription`,
  });

  return { url: session.url, sessionId: session.id };
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Upgrade a subscription to a higher plan with proration
 * - Checks if payment method exists
 * - If yes: updates subscription with proration (charges difference)
 * - If no: returns checkout URL to add payment method first
 * - Updates firm limits after successful upgrade
 */
export async function upgradeSubscription(firmId: string, newPlanId: string, billingPeriod: "monthly" | "yearly") {
  const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);
  if (!subscription) throw new Error("No active subscription");

  const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
  if (!firm) throw new Error("Firm not found");

  const [newPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, newPlanId)).limit(1);
  if (!newPlan) throw new Error("Plan not found");

  const priceId = billingPeriod === "yearly" ? newPlan.stripePriceIdYearly : newPlan.stripePriceIdMonthly;
  if (!priceId) throw new Error("Stripe price not configured");

  const seatCount = subscription.seatCount || 1;

  // Get or create Stripe customer
  let stripeCustomerId = subscription.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: firm.email || undefined,
      name: firm.name,
      metadata: { firmId },
    });
    stripeCustomerId = customer.id;
    await db.update(firmSubscriptions).set({ stripeCustomerId }).where(eq(firmSubscriptions.firmId, firmId));
  }

  // Check if customer has a default payment method
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  const hasPaymentMethod = 'invoice_settings' in customer &&
    customer.invoice_settings?.default_payment_method;

  // If no payment method and no active subscription, redirect to checkout
  if (!hasPaymentMethod && !subscription.stripeSubscriptionId) {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: seatCount }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?upgrade=cancelled`,
      metadata: { firmId, type: "upgrade", newPlanId, billingPeriod },
      subscription_data: { metadata: { firmId, planId: newPlanId } },
    });
    return { checkoutUrl: session.url, requiresCheckout: true };
  }

  // If has existing subscription, update it with proration
  if (subscription.stripeSubscriptionId) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      // Update the subscription with proration
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId,
          quantity: seatCount,
        }],
        proration_behavior: "create_prorations",
        payment_behavior: "error_if_incomplete",
      });

      // Update local database
      await db.update(firmSubscriptions)
        .set({
          planId: newPlanId,
          billingPeriod,
          status: "active",
          downgradeToPlanId: null,
          updatedAt: new Date(),
        })
        .where(eq(firmSubscriptions.firmId, firmId));

      // Update firm limits (uses centralized logic to account for add-ons)
      const { updateFirmLimits } = await import("@/lib/subscription/limits");
      await updateFirmLimits(firmId);

      return { success: true, message: "Upgrade completed successfully" };

    } catch (error: any) {
      // Handle payment failure - redirect to update payment method
      if (error.code === "card_declined" || error.type === "StripeCardError") {
        // Create a portal session to update payment method
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
        });
        return {
          requiresPayment: true,
          portalUrl: portalSession.url,
          message: "Payment failed. Please update your payment method."
        };
      }
      throw error;
    }
  }

  // No existing subscription - create checkout
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: seatCount }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?upgrade=cancelled`,
    metadata: { firmId, type: "upgrade", newPlanId, billingPeriod },
    subscription_data: { metadata: { firmId, planId: newPlanId } },
  });

  return { checkoutUrl: session.url, requiresCheckout: true };
}

/**
 * Add a seat to the subscription (when adding a team member)
 * Charges the prorated amount for the new seat
 */
export async function addSeat(firmId: string): Promise<{ success: boolean; message?: string; requiresPayment?: boolean; portalUrl?: string }> {
  const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }

  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription.planId)).limit(1);
  if (!plan) throw new Error("Plan not found");

  const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
  if (!firm) throw new Error("Firm not found");

  const newSeatCount = (subscription.seatCount || 1) + 1;

  // Check seat limit
  if (plan.maxUsers && newSeatCount > plan.maxUsers) {
    return { success: false, message: "Maximum seats reached for this plan" };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Update subscription quantity with proration
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        quantity: newSeatCount,
      }],
      proration_behavior: "create_prorations",
      payment_behavior: "error_if_incomplete",
    });

    // Update local database
    await db.update(firmSubscriptions)
      .set({ seatCount: newSeatCount, updatedAt: new Date() })
      .where(eq(firmSubscriptions.firmId, firmId));

    // Update firm limits (uses centralized logic to account for add-ons)
    const { updateFirmLimits } = await import("@/lib/subscription/limits");
    await updateFirmLimits(firmId);

    // Also update currentUsers count manually
    await db.update(firms)
      .set({
        currentUsers: (firm.currentUsers || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(firms.id, firmId));

    return { success: true };

  } catch (error: any) {
    if (error.code === "card_declined" || error.type === "StripeCardError") {
      const stripeCustomerId = subscription.stripeCustomerId;
      if (stripeCustomerId) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/team`,
        });
        return {
          success: false,
          requiresPayment: true,
          portalUrl: portalSession.url,
          message: "Payment failed. Please update your payment method."
        };
      }
    }
    throw error;
  }
}

/**
 * Remove a seat from the subscription (when removing a team member)
 * Reduces the quantity - Stripe will apply credit on next billing
 */
export async function removeSeat(firmId: string): Promise<{ success: boolean }> {
  const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }

  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription.planId)).limit(1);
  if (!plan) throw new Error("Plan not found");

  const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
  if (!firm) throw new Error("Firm not found");

  const newSeatCount = Math.max(1, (subscription.seatCount || 1) - 1);

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

  // Update subscription quantity
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [{
      id: stripeSubscription.items.data[0].id,
      quantity: newSeatCount,
    }],
    proration_behavior: "none",
  });

  // Update local database
  await db.update(firmSubscriptions)
    .set({ seatCount: newSeatCount, updatedAt: new Date() })
    .where(eq(firmSubscriptions.firmId, firmId));

  // Update firm limits (uses centralized logic to account for add-ons)
  const { updateFirmLimits } = await import("@/lib/subscription/limits");
  await updateFirmLimits(firmId);

  // Also update currentUsers count manually
  await db.update(firms)
    .set({
      currentUsers: Math.max(0, (firm.currentUsers || 1) - 1),
      updatedAt: new Date()
    })
    .where(eq(firms.id, firmId));

  return { success: true };
}

/**
 * Request a downgrade (takes effect at period end)
 */
export async function requestDowngrade(firmId: string, newPlanId: string) {
  await db.update(firmSubscriptions)
    .set({
      downgradeToPlanId: newPlanId,
      updatedAt: new Date(),
    })
    .where(eq(firmSubscriptions.firmId, firmId));

  return { success: true, message: "Downgrade scheduled for end of billing period" };
}

/**
 * Cancel subscription (at period end)
 */
export async function cancelSubscription(firmId: string) {
  const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);
  if (!subscription?.stripeSubscriptionId) throw new Error("No active subscription");

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db.update(firmSubscriptions)
    .set({
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(firmSubscriptions.firmId, firmId));

  return { success: true };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user has already used their free trial
 */
export async function hasUsedFreeTrial(userId: string): Promise<boolean> {
  const [user] = await db.select({ usedFreeTrial: users.usedFreeTrial }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.usedFreeTrial ?? false;
}

/**
 * Mark user as having used their free trial
 */
export async function markFreeTrialUsed(userId: string) {
  await db.update(users)
    .set({ usedFreeTrial: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
