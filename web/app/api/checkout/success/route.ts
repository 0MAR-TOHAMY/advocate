/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, verifyToken, AccessTokenPayload, signAccessToken, setAccessCookie, getRedis } from "@/lib/auth";
import { defaultLocale } from "@/lib/config/i18n.config";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.redirect(new URL(`/${defaultLocale}/login`, req.url));
    }

    const payload = verifyToken<AccessTokenPayload>(token);
    const redis = getRedis();
    let firmId = "";
    const sessionId = req.nextUrl.searchParams.get("session_id") || "";

    if (!sessionId) {
      return NextResponse.redirect(new URL(`/${defaultLocale}/onboarding/plan`, req.url));
    }

    // 1. Try to get firmId from Redis (set by webhook or previous success call)
    if (redis) {
      try {
        firmId = (await redis.get(`stripe:session:${sessionId}:firmId`)) || "";
      } catch (e) {
        console.warn("Redis error in checkout success:", e);
      }
    }

    // 2. Self-Healing: If not in Redis, fetch session from Stripe and finalize manually
    if (!firmId) {
      try {
        const { stripe } = await import("@/lib/stripe");
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
          const { finalizeFirmOnboarding } = await import("@/lib/stripe/onboarding");
          const result = await finalizeFirmOnboarding({
            sessionId: session.id,
            userId: session.metadata?.userId as string,
            planId: session.metadata?.planId as string,
            firmDraftId: session.metadata?.firmDraftId as string,
            billingPeriod: (session.metadata?.billingPeriod as "monthly" | "yearly") || "monthly",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          });
          if (result.success) {
            firmId = result.firmId;
          }
        }
      } catch (e) {
        console.error("Self-healing error in success route:", e);
      }
    }

    // 3. Fallback: Check DB directly if firmId still not found
    if (!firmId) {
      try {
        const [user] = await db.select({ firmId: users.firmId }).from(users).where(eq(users.id, payload.userId)).limit(1);
        if (user?.firmId) {
          firmId = user.firmId;
        }
      } catch (e) {
        console.warn("DB error in checkout success:", e);
      }
    }

    if (!firmId) {
      console.error("Failed to retrieve firmId after payment for session:", sessionId);
      return NextResponse.redirect(new URL(`/${defaultLocale}/onboarding/plan?error=payment_processing`, req.url));
    }

    // Fetch fresh user data to get the correct role
    let role = payload.role || "admin";
    let userRecord: any = null;
    try {
      const [userRow] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (userRow) {
        userRecord = userRow;
        role = userRow.role || role;
      }
    } catch (e) {
      console.warn("Error fetching fresh user data:", e);
    }

    // Update access token with firmId and fresh role
    const newAccess = signAccessToken({
      userId: payload.userId,
      role,
      firmId,
      firmName: userRecord?.firmName || null,
    });

    // Create response with redirect to firm profile setup
    const res = NextResponse.redirect(new URL(`/${defaultLocale}/onboarding/firm-profile?firmId=${firmId}`, req.url));
    res.cookies.set({
      name: "access_token",
      value: newAccess,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return res;
  } catch (error) {
    console.error("Checkout success error:", error);
    return NextResponse.redirect(new URL(`/${defaultLocale}/onboarding/plan?error=unknown`, req.url));
  }
}