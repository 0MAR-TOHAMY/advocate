import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmSubscriptions, firms, users, firmUsers, roles } from "@/lib/schema";
import { and, eq, lte, gte } from "drizzle-orm";
import { sendTrialEndingEmail } from "@/lib/email/service";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production") {
        if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const now = new Date();

        // Find trials ending in exactly 3 days or 1 day
        const checkDates = [3, 1];
        let totalSent = 0;

        for (const days of checkDates) {
            const targetDateStart = new Date();
            targetDateStart.setDate(now.getDate() + days);
            targetDateStart.setHours(0, 0, 0, 0);

            const targetDateEnd = new Date();
            targetDateEnd.setDate(now.getDate() + days);
            targetDateEnd.setHours(23, 59, 59, 999);

            const nearingEndTrials = await db.select({
                subscriptionId: firmSubscriptions.id,
                firmId: firmSubscriptions.firmId,
                trialEndsAt: firmSubscriptions.trialEndsAt,
                firmName: firms.name,
                adminEmail: users.email,
                adminName: users.name
            })
                .from(firmSubscriptions)
                .innerJoin(firms, eq(firmSubscriptions.firmId, firms.id))
                .innerJoin(firmUsers, eq(firmUsers.firmId, firms.id))
                .innerJoin(roles, and(eq(firmUsers.roleId, roles.id), eq(roles.name, "owner")))
                .innerJoin(users, eq(firmUsers.userId, users.id))
                .where(and(
                    eq(firmSubscriptions.status, "trial"),
                    gte(firmSubscriptions.trialEndsAt, targetDateStart),
                    lte(firmSubscriptions.trialEndsAt, targetDateEnd)
                ));

            for (const trial of nearingEndTrials) {
                if (trial.adminEmail) {
                    await sendTrialEndingEmail(
                        trial.adminEmail,
                        trial.adminName || "Admin",
                        trial.firmName,
                        trial.trialEndsAt?.toLocaleDateString() || "",
                        days
                    );
                    totalSent++;
                }
            }
        }

        return NextResponse.json({ success: true, sent: totalSent });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
