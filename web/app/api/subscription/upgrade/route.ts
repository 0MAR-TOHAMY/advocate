import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { upgradeSubscription } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId || !session.firmId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { planId, billingPeriod } = await req.json();

        if (!planId) {
            return NextResponse.json({ message: "Plan ID required" }, { status: 400 });
        }

        const result = await upgradeSubscription(
            session.firmId,
            planId,
            billingPeriod || "monthly"
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Upgrade error:", error);
        return NextResponse.json({ message: "Upgrade failed" }, { status: 500 });
    }
}
