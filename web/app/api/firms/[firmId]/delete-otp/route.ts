
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload, getRedis } from "@/lib/auth";
import { sendFirmDeletionOtpEmail } from "@/lib/email/service";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        // 1. Verify User is Admin of Firm
        const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
        if (!firm) return NextResponse.json({ message: "Firm not found" }, { status: 404 });

        if (firm.adminId !== payload.userId) {
            return NextResponse.json({ message: "Only firm owner can request deletion" }, { status: 403 });
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Store in Redis
        const redis = getRedis();
        if (!redis) return NextResponse.json({ message: "Service unavailable" }, { status: 503 });

        const key = `delete_firm_otp:${firmId}`;
        await redis.set(key, otp, "EX", 600); // 10 minutes

        // 4. Send Email
        // Get user email
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (!user || !user.email) {
            return NextResponse.json({ message: "User email not found" }, { status: 404 });
        }

        await sendFirmDeletionOtpEmail(user.email, user.name || "Admin", firm.name, otp);

        return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    } catch (error) {
        console.error("OTP Error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
