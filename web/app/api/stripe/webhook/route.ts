/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { firms, subscriptionPlans, firmUsers, roles, users, firmSubscriptions, firmDrafts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getRedis } from "@/lib/auth";
import { PermissionKeys } from "@/lib/rbac/permissions";

const TRIAL_DAYS = 45;
const GB_IN_BYTES = 1024 * 1024 * 1024;

function verifySignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, kv) => {
    const [k, v] = kv.split("=");
    if (!acc[k]) acc[k] = [];
    acc[k].push(v);
    return acc;
  }, {});
  const t = parts["t"]?.[0];
  const v1s = parts["v1"] || [];
  if (!t || v1s.length === 0) return false;
  const signedPayload = `${t}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return v1s.some((v) => v === expected);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const sig = req.headers.get("stripe-signature") || "";
    const body = await req.text();
    const ok = verifySignature(body, sig, secret);
    if (!ok) return NextResponse.json({ message: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(body);
    const redis = getRedis();

    // Idempotency check
    if (redis) {
      const key = `stripe:event:${event.id}`;
      const exists = await redis.get(key);
      if (exists) return NextResponse.json({ received: true }, { status: 200 });
      await redis.set(key, "1", "EX", 24 * 60 * 60);
    }

    // =========================================================================
    // CHECKOUT COMPLETED - CREATE FIRM OR UPGRADE
    // =========================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const sessionType = session.metadata?.type as string;

      // Handle UPGRADE checkout
      if (sessionType === "upgrade") {
        const firmId = session.metadata?.firmId as string;
        const newPlanId = session.metadata?.newPlanId as string;
        const billingPeriod = (session.metadata?.billingPeriod as "monthly" | "yearly") || "monthly";
        const oldSubscriptionId = session.metadata?.oldSubscriptionId as string;

        if (!firmId || !newPlanId) {
          console.error("Missing metadata in upgrade checkout session");
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Get the new plan details
        const [newPlan] = await db.select().from(subscriptionPlans as any).where(eq((subscriptionPlans as any).id, newPlanId)).limit(1) as any[];
        if (!newPlan) {
          console.error("Plan not found:", newPlanId);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Cancel old subscription in Stripe (if exists)
        if (oldSubscriptionId) {
          try {
            const stripe = (await import("stripe")).default;
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || "");
            await stripeClient.subscriptions.cancel(oldSubscriptionId);
          } catch (e) {
            console.log("Failed to cancel old subscription:", e);
          }
        }

        // Get current subscription to get seat count
        const [existingSub] = await db.select().from(firmSubscriptions as any).where(eq((firmSubscriptions as any).firmId, firmId)).limit(1) as any[];
        const seatCount = existingSub?.seatCount || 1;

        // Update local database
        await db.update(firmSubscriptions as any)
          .set({
            planId: newPlanId,
            billingPeriod,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (billingPeriod === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
            downgradeToPlanId: null,
            updatedAt: new Date(),
          })
          .where(eq((firmSubscriptions as any).firmId, firmId));

        // Update firm limits (uses centralized logic to account for add-ons)
        const { updateFirmLimits } = await import("@/lib/subscription/limits");
        await updateFirmLimits(firmId);

        // Also update firm status and planId explicitly
        await db.update(firms as any).set({
          planId: newPlanId,
          subscriptionStatus: "active",
          updatedAt: new Date(),
        }).where(eq((firms as any).id, firmId));

        console.log(`Upgrade completed for firm ${firmId} to plan ${newPlanId}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Handle NEW FIRM checkout
      const userId = session.metadata?.userId as string;
      const planId = session.metadata?.planId as string;
      const firmDraftId = session.metadata?.firmDraftId as string;
      const billingPeriod = (session.metadata?.billingPeriod as "monthly" | "yearly") || "monthly";

      if (!userId || !planId) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { finalizeFirmOnboarding } = await import("@/lib/stripe/onboarding");
      await finalizeFirmOnboarding({
        sessionId: session.id,
        userId,
        planId,
        firmDraftId,
        billingPeriod,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });
    }

    // =========================================================================
    // SUBSCRIPTION UPDATED
    // =========================================================================
    else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const stripeSubId = sub.id as string;
      const status = sub.status as string;

      // Find firm subscription by stripe subscription ID
      const [subscription] = await db.select().from(firmSubscriptions as any).where(eq((firmSubscriptions as any).stripeSubscriptionId, stripeSubId)).limit(1) as any[];
      if (!subscription) {
        console.log("Subscription not found:", stripeSubId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Map Stripe status to our status
      let firmStatus: "trial" | "active" | "past_due" | "canceled" | "expired" | "read_only" = "active";
      if (status === "active") {
        firmStatus = "active";
      } else if (status === "past_due") {
        firmStatus = "past_due";
      } else if (status === "canceled" || status === "unpaid") {
        firmStatus = "read_only";
      } else if (status === "trialing") {
        firmStatus = "trial";
      }

      // Check for downgrade at period end
      if (firmStatus === "active" && subscription.downgradeToPlanId) {
        // Apply the downgrade
        await db.update(firmSubscriptions as any).set({
          planId: subscription.downgradeToPlanId,
          downgradeToPlanId: null,
          status: firmStatus,
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
          updatedAt: new Date(),
        }).where(eq((firmSubscriptions as any).firmId, subscription.firmId));

        // Update firm limits (uses centralized logic to account for add-ons)
        const { updateFirmLimits } = await import("@/lib/subscription/limits");
        await updateFirmLimits(subscription.firmId);

        // Update firm's planId and status
        await db.update(firms as any).set({
          planId: subscription.downgradeToPlanId,
          subscriptionStatus: firmStatus,
          updatedAt: new Date(),
        }).where(eq((firms as any).id, subscription.firmId));
      } else {
        // Normal update
        await db.update(firmSubscriptions as any).set({
          status: firmStatus,
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
          updatedAt: new Date(),
        }).where(eq((firmSubscriptions as any).firmId, subscription.firmId));

        await db.update(firms as any).set({
          subscriptionStatus: firmStatus,
          updatedAt: new Date(),
        }).where(eq((firms as any).id, subscription.firmId));
      }
    }

    // =========================================================================
    // SUBSCRIPTION DELETED
    // =========================================================================
    else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const stripeSubId = sub.id as string;

      const [subscription] = await db.select().from(firmSubscriptions as any).where(eq((firmSubscriptions as any).stripeSubscriptionId, stripeSubId)).limit(1) as any[];
      if (subscription) {
        await db.update(firms as any).set({
          subscriptionStatus: "canceled",
          updatedAt: new Date(),
        }).where(eq((firms as any).id, subscription.firmId));

        await db.update(firmSubscriptions as any).set({
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        }).where(eq((firmSubscriptions as any).firmId, subscription.firmId));
      }
    }

    // =========================================================================
    // PAYMENT FAILED
    // =========================================================================
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const stripeSubId = invoice.subscription as string;

      if (stripeSubId) {
        const [subscription] = await db.select().from(firmSubscriptions as any).where(eq((firmSubscriptions as any).stripeSubscriptionId, stripeSubId)).limit(1) as any[];
        if (subscription) {
          await db.update(firms as any).set({
            subscriptionStatus: "past_due",
            updatedAt: new Date(),
          }).where(eq((firms as any).id, subscription.firmId));

          await db.update(firmSubscriptions as any).set({
            status: "past_due",
            updatedAt: new Date(),
          }).where(eq((firmSubscriptions as any).firmId, subscription.firmId));

          // Send payment failed email to firm owner
          try {
            const [firm] = await db.select().from(firms as any).where(eq((firms as any).id, subscription.firmId)).limit(1) as any[];
            const [ownerMember] = await db.select()
              .from(firmUsers as any)
              .innerJoin(roles as any, eq((firmUsers as any).roleId, (roles as any).id))
              .innerJoin(users as any, eq((firmUsers as any).userId, (users as any).id))
              .where(eq((firmUsers as any).firmId, subscription.firmId))
              .limit(1) as any[];

            if (ownerMember && firm) {
              const { sendPaymentFailedEmail } = await import("@/lib/email/service");
              const { createFirmNotification } = await import("@/lib/notifications/service");
              const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/subscription`;

              await sendPaymentFailedEmail(
                ownerMember.users.email,
                ownerMember.users.name || "Admin",
                firm.name,
                billingUrl
              );

              await createFirmNotification({
                firmId: firm.id,
                type: "billing",
                title: "Payment Failed",
                message: `We were unable to process your subscription payment for ${firm.name}. Please update your payment method.`,
                severity: "error",
                linkUrl: `/dashboard/subscription`
              });
            }
          } catch (e) {
            console.error("Failed to send payment failed notifications:", e);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}