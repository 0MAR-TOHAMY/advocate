import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, firms, subscriptionPlans, firmUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload, signAccessToken, setAccessCookie } from "@/lib/auth";
import { nanoid } from "nanoid";

/**
 * API Route: Create Firm Directly (for Free Plan)
 * Creates a firm without requiring Stripe payment
 */
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

        // 4. Get request body
        const body = await req.json();
        const { planId, firmData } = body as {
            planId: string;
            firmData: {
                name: string;
                logoUrl?: string;
                timezone?: string;
                address?: string;
                phone?: string;
                email?: string;
                licenseNumber?: string;
            };
        };

        if (!planId || !firmData?.name) {
            return NextResponse.json({ message: "البيانات مطلوبة" }, { status: 400 });
        }

        // 5. Verify this is a free plan
        const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
        if (!plan || !plan.isActive) {
            return NextResponse.json({ message: "الخطة غير موجودة" }, { status: 404 });
        }

        if (plan.planType !== "free" && (plan.pricePerUserMonthly ?? 0) > 0) {
            return NextResponse.json({ message: "هذا المسار للخطة المجانية فقط" }, { status: 400 });      
        }

        // 6. Create the firm
        const firmId = nanoid();
        const joinCode = nanoid(8).toUpperCase();
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + (plan.trialDays || 45));

        await db.insert(firms).values({
            id: firmId,
            name: firmData.name,
            logoUrl: firmData.logoUrl || null,
            timezone: firmData.timezone || "Asia/Dubai",
            address: firmData.address || null,
            phone: firmData.phone || null,
            email: firmData.email || null,
            licenseNumber: firmData.licenseNumber || null,
            adminId: payload.userId,
            planId: plan.id,
            maxUsers: plan.maxUsers || 2,
            currentUsers: 1,
            subscriptionStatus: "trial",
            subscriptionStart: new Date(),
            trialEndsAt,
            joinCode,
            maxStorageBytes: plan.storagePerUserGB ? String(BigInt(plan.storagePerUserGB) * BigInt(1024 * 1024 * 1024)) : null,
            isActive: true,
        });

        // 7. Update user to link to firm and set as admin
        await db.update(users)
            .set({
                firmId,
                firmName: firmData.name,
                role: "admin",
                updatedAt: new Date(),
            })
            .where(eq(users.id, payload.userId));

        // 8. Create firm_users record
        try {
            await db.insert(firmUsers).values({
                id: nanoid(),
                firmId,
                userId: payload.userId,
                roleId: null, // Will use default admin role
                status: "active",
                joinedAt: new Date(),
            });
        } catch {
            // Ignore if table doesn't exist or other errors
        }

        // 9. Update access token with firmId
        const newAccess = signAccessToken({
            userId: payload.userId,
            role: "admin",
            firmId,
            firmName: firmData.name,
        });

        const res = NextResponse.json({
            success: true,
            firmId,
            message: "تم إنشاء المكتب بنجاح",
        });

        res.cookies.set({
            name: "access_token",
            value: newAccess,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 15 * 60, // 15 minutes
        });

        return res;
    } catch (error) {
        console.error("Create firm error:", error);
        return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
    }
}
