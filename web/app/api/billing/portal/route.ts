import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;

        // If no customer ID, create one on the fly
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user.id,
                    firmId: user.firmId || "",
                },
            });
            customerId = customer.id;

            // Update user in DB
            await db.update(users)
                .set({ stripeCustomerId: customerId, updatedAt: new Date() })
                .where(eq(users.id, userId));
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${baseUrl}/dashboard/subscription`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error("Portal error:", error);
        return NextResponse.json({ message: "Failed to create portal session" }, { status: 500 });
    }
}
