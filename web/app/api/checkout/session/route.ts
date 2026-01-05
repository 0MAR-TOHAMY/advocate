import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { createPlanCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user || !user.isVerified) return NextResponse.json({ message: "يرجى التحقق" }, { status: 403 });
    const body = await req.json();
    const { planId, firmDraftId, billingPeriod } = body as { planId: string; firmDraftId: string; billingPeriod: "monthly" | "yearly" };
    if (!planId) return NextResponse.json({ message: "planId مطلوب" }, { status: 400 });

    // Using the correct function from lib/stripe
    const sessionResponse = await createPlanCheckoutSession({
      planId,
      userId: payload.userId,
      firmDraftId: firmDraftId || "", // Assuming it might come from body
      billingPeriod: billingPeriod || "monthly"
    });

    if (sessionResponse.type === "free") {
      return NextResponse.json({ type: "free", planId: sessionResponse.planId });
    }

    return NextResponse.json({ id: sessionResponse.sessionId, url: sessionResponse.url }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}