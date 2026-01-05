import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requestDowngrade } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId || !session.firmId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json({ message: "Plan ID required" }, { status: 400 });
        }

        const result = await requestDowngrade(session.firmId, planId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Downgrade error:", error);
        return NextResponse.json({ message: "Downgrade failed" }, { status: 500 });
    }
}
