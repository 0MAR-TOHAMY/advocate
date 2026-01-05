import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, subscriptionPlans, firmSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        }

        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        // Verify user belongs to this firm
        if (payload.firmId !== firmId) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
        }

        // Get firm with subscription details
        const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
        if (!firm) {
            return NextResponse.json({ message: "المكتب غير موجود" }, { status: 404 });
        }

        // Get subscription record
        const [subscription] = await db.select().from(firmSubscriptions).where(eq(firmSubscriptions.firmId, firmId)).limit(1);

        // Get plan details if available
        let plan = null;
        if (firm.planId) {
            const [planData] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, firm.planId)).limit(1);
            plan = planData;
        }

        const billingPeriod = subscription?.billingPeriod || "monthly";
        const priceCents =
            billingPeriod === "yearly"
                ? (plan?.pricePerUserYearly ?? plan?.pricePerUserMonthly ?? 0)
                : (plan?.pricePerUserMonthly ?? 0);
        const price = (priceCents / 100).toFixed(2);

        return NextResponse.json({
            subscription: {
                status: firm.subscriptionStatus,
                planId: firm.planId,
                planName: plan?.name,
                planType: plan?.planType,
                price,
                currency: plan?.currency,
                billingPeriod,
                maxUsers: firm.maxUsers,
                currentUsers: firm.currentUsers,
                maxStorageGB: plan?.storagePerUserGB ?? null,
                trialEndsAt: firm.trialEndsAt?.toISOString(),
                currentPeriodStart: subscription?.currentPeriodStart?.toISOString(),
                currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
                canceledAt: subscription?.canceledAt?.toISOString(),
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Get subscription error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}
