import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmAddOns, storageAddOns, firms, firmSubscriptions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { nanoid } from "nanoid";

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

        if (payload.firmId !== firmId) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
        }

        // Get all available add-ons
        const availableAddOns = await db
            .select()
            .from(storageAddOns as any)
            .where(eq((storageAddOns as any).isActive, true)) as any[];

        // Get firm's active add-ons
        const firmActiveAddOns = await db
            .select({
                id: (firmAddOns as any).id,
                addOnId: (firmAddOns as any).addOnId,
                status: (firmAddOns as any).status,
                purchasedAt: (firmAddOns as any).purchasedAt,
                name: (storageAddOns as any).name,
                storageSizeGB: (storageAddOns as any).storageSizeGB,
                priceMonthly: (storageAddOns as any).priceMonthly,
                currency: (storageAddOns as any).currency,
                expiresAt: (firmAddOns as any).expiresAt,
            })
            .from(firmAddOns as any)
            .leftJoin(storageAddOns as any, eq((firmAddOns as any).addOnId, (storageAddOns as any).id))
            .where(and(eq((firmAddOns as any).firmId, firmId), eq((firmAddOns as any).status, "active"))) as any[];

        return NextResponse.json({
            available: availableAddOns,
            purchased: firmActiveAddOns,
        }, { status: 200 });
    } catch (error) {
        console.error("Get add-ons error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}

export async function POST(
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

        if (payload.firmId !== firmId) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
        }

        // Get firm and verify subscription is active
        const [firm] = await db.select().from(firms as any).where(eq((firms as any).id, firmId)).limit(1) as any[];
        if (!firm) {
            return NextResponse.json({ message: "المكتب غير موجود" }, { status: 404 });
        }

        if (firm.subscriptionStatus === "canceled" || firm.subscriptionStatus === "expired") {
            return NextResponse.json({ message: "الاشتراك غير نشط" }, { status: 403 });
        }

        const body = await req.json();
        const { addOnId } = body as { addOnId: string };

        if (!addOnId) {
            return NextResponse.json({ message: "معرف الإضافة مطلوب" }, { status: 400 });
        }

        // Verify add-on exists
        const [addOn] = await db.select().from(storageAddOns as any).where(eq((storageAddOns as any).id, addOnId)).limit(1) as any[];
        if (!addOn || !addOn.isActive) {
            return NextResponse.json({ message: "الإضافة غير موجودة" }, { status: 404 });
        }

        // Check if already purchased
        const [existing] = await db
            .select()
            .from(firmAddOns as any)
            .where(and(eq((firmAddOns as any).firmId, firmId), eq((firmAddOns as any).addOnId, addOnId), eq((firmAddOns as any).status, "active")))
            .limit(1) as any[];

        if (existing) {
            return NextResponse.json({ message: "هذه الإضافة مفعلة بالفعل" }, { status: 400 });
        }

        // 1. Create Invoice Item (Charge immediately)
        // Note: In a real app, you might want to attach this to a specific customer ID from Stripe
        // We assume firm has a stripeCustomerId. If not, we can't charge.

        // Fetch firm's stripe subscription to get customer ID
        // Or get it from firm table if you store stripeCustomerId there. 
        // Let's assume user.firmId -> firmSubscriptions -> stripeSubscriptionId

        // 1. Get firm subscription for customer and subscription ID
        const [subscription] = await db.select().from(firmSubscriptions as any).where(eq((firmSubscriptions as any).firmId, firmId)).limit(1) as any[];

        if (!subscription?.stripeCustomerId) {
            return NextResponse.json({ message: "يجب ربط وسيلة دفع أولاً (اشتراك مفعل)" }, { status: 400 });
        }

        const { stripe } = await import("@/lib/stripe");
        const customerId = subscription.stripeCustomerId;

        try {
            // Create Invoice Item (One-time charge)
            // priceMonthly is a decimal string from the DB, convert to cents for Stripe
            const amountInCents = Math.round(parseFloat(addOn.priceMonthly as any) * 100);

            await stripe.invoiceItems.create({
                customer: customerId,
                amount: amountInCents,
                currency: addOn.currency || 'usd',
                description: `Storage Add-on: ${addOn.name} (30 Days)`,
            });

            // Create and Pay Invoice
            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true,
                collection_method: "charge_automatically",
                description: `Purchase of ${addOn.name} storage add-on`,
            });

            const paidInvoice = await stripe.invoices.pay(invoice.id);

            if (paidInvoice.status !== 'paid') {
                return NextResponse.json({ message: "فشل الدفع. يرجى التحقق من وسيلة الدفع الخاصة بك." }, { status: 400 });
            }
        } catch (stripeError: any) {
            console.error("Stripe error:", stripeError);
            return NextResponse.json({
                message: stripeError.message || "حدث خطأ أثناء معالجة الدفع عبر Stripe"
            }, { status: 400 });
        }

        // 2. Create firm add-on record with 30 days expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const [newFirmAddOn] = await db.insert(firmAddOns as any).values({
            id: nanoid(),
            firmId,
            addOnId,
            status: "active",
            purchasedAt: new Date(),
            expiresAt: expiresAt,
        }).returning() as any[];

        // 3. Update firm storage immediately
        const { updateFirmLimits } = await import("@/lib/subscription/limits");
        await updateFirmLimits(firmId);

        return NextResponse.json({ addOn: newFirmAddOn }, { status: 201 });
    } catch (error) {
        console.error("Purchase add-on error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}

export async function DELETE(
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

        if (payload.firmId !== firmId) {
            return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
        }

        const url = new URL(req.url);
        const firmAddOnId = url.searchParams.get("id");

        if (!firmAddOnId) {
            return NextResponse.json({ message: "معرف الإضافة مطلوب" }, { status: 400 });
        }

        // Cancel the add-on
        await db.update(firmAddOns as any).set({
            status: "canceled",
            canceledAt: new Date(),
        }).where(and(eq((firmAddOns as any).id, firmAddOnId), eq((firmAddOns as any).firmId, firmId)));

        // Update firm storage limits
        const { updateFirmLimits } = await import("@/lib/subscription/limits");
        await updateFirmLimits(firmId);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Cancel add-on error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}
