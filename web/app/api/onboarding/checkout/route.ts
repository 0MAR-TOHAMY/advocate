import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptionPlans } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload, getRedis } from "@/lib/auth";
import { nanoid } from "nanoid";

const TRIAL_DAYS = 45;

export async function POST(req: NextRequest) {
    try {
        // 1. Verify user is authenticated
        const token = await getAccessToken();
        if (!token) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        }
        const payload = verifyToken<AccessTokenPayload>(token);

        // 2. Get user and verify
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (!user || !user.isVerified) {
            return NextResponse.json({ message: "يرجى التحقق من البريد الإلكتروني" }, { status: 403 });
        }

        // 3. Check if user already has a firm
        if (user.firmId) {
            return NextResponse.json({ message: "لديك مكتب بالفعل" }, { status: 400 });
        }

        // 4. Get plan details
        const body = await req.json();
        const { planId, firmData } = body as {
            planId: string;
            firmData?: {
                name?: string;
                logoUrl?: string;
                timezone?: string;
                address?: string;
                phone?: string;
                email?: string;
                licenseNumber?: string;
            };
        };

        if (!planId) {
            return NextResponse.json({ message: "الخطة مطلوبة" }, { status: 400 });
        }

        const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
        if (!plan || !plan.isActive) {
            return NextResponse.json({ message: "الخطة غير موجودة" }, { status: 404 });
        }

        // 5. Get Stripe price ID from environment
        const planType = String(plan.planType).toUpperCase();
        const priceId = process.env[`STRIPE_PRICE_${planType}`];
        if (!priceId) {
            return NextResponse.json({ message: "لم يتم تكوين سعر Stripe" }, { status: 500 });
        }

        // 6. Create a draft firm ID (not saved to DB yet)
        const draftFirmId = nanoid();

        // 7. Store draft data in Redis for webhook to use
        const redis = getRedis();
        if (redis) {
            const draftData = {
                firmId: draftFirmId,
                userId: payload.userId,
                planId: plan.id,
                firmName: firmData?.name || "مكتب جديد",
                firmData: firmData || {},
                planType: plan.planType,
                maxUsers: plan.maxUsers,
                maxStorageGB: plan.storagePerUserGB,
                trialDays: TRIAL_DAYS,
            };
            await redis.set(`draft:firm:${draftFirmId}`, JSON.stringify(draftData), "EX", 60 * 60); // 1 hour expiry
        }

        // 8. Create Stripe checkout session
        const secret = process.env.STRIPE_SECRET_KEY || "";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const form = new URLSearchParams();
        form.set("mode", "subscription");
        form.set("success_url", `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
        form.set("cancel_url", `${baseUrl}/onboarding/plan`);
        form.set("line_items[0][price]", priceId);
        form.set("line_items[0][quantity]", "1");
        form.set("subscription_data[trial_period_days]", String(TRIAL_DAYS));
        form.set("metadata[userId]", payload.userId);
        form.set("metadata[planId]", plan.id);
        form.set("metadata[draftFirmId]", draftFirmId);

        // Customer email for better UX
        if (user.email) {
            form.set("customer_email", user.email);
        }

        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Stripe error:", err);
            return NextResponse.json({ message: "فشل إنشاء جلسة الدفع" }, { status: 500 });
        }

        const session = await res.json();

        // Store session → draftFirmId mapping in Redis
        if (redis) {
            await redis.set(`stripe:session:${session.id}:draftFirmId`, draftFirmId, "EX", 60 * 60);
        }

        return NextResponse.json({
            id: session.id,
            url: session.url,
        }, { status: 200 });
    } catch (error) {
        console.error("Onboarding checkout error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}
