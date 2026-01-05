import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmAddOns } from "@/lib/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
// import { stripe } from "@/lib/stripe"; // Not needed for now unless we want to log something to Stripe

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production") {
        if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const now = new Date();

        // 1. Find expired add-ons
        const expiredAddOns = await db
            .select()
            .from(firmAddOns as any)
            .where(
                and(
                    eq((firmAddOns as any).status, "active"),
                    lt((firmAddOns as any).expiresAt, now)
                )
            ) as any[];

        if (expiredAddOns.length === 0) {
            return NextResponse.json({ message: "No expired add-ons found", processed: 0 });
        }

        // 2. Mark them as expired
        await db.update(firmAddOns as any)
            .set({ status: "expired" })
            .where(inArray((firmAddOns as any).id, expiredAddOns.map(a => a.id)));

        // 3. Recalculate storage for affected firms
        const affectedFirmIds = [...new Set(expiredAddOns.map(a => a.firmId))];
        let processedCount = 0;

        for (const firmId of affectedFirmIds) {
            try {
                const { updateFirmLimits } = await import("@/lib/subscription/limits");
                await updateFirmLimits(firmId);
                processedCount++;
            } catch (err) {
                console.error(`Error processing firm ${firmId}:`, err);
            }
        }

        return NextResponse.json({
            message: "Processed",
            expiredCount: expiredAddOns.length,
            firmsUpdated: processedCount
        });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
