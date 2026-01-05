import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, roles, joinRequests, firmUsers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { presignGet } from "@/lib/s3/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmViewDashboard);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);

    // Presign license URL if it's a key
    if (firm?.licenseUrl && !firm.licenseUrl.startsWith("http")) {
      try {
        firm.licenseUrl = await presignGet("documents", firm.licenseUrl);
      } catch (e) {
        console.error("Failed to presign license url", e);
      }
    }

    const firmRoles = await db.select().from(roles).where(eq(roles.firmId, firmId));
    const members = await db.select().from(firmUsers).where(eq(firmUsers.firmId, firmId));
    const pending = await db
      .select()
      .from(joinRequests)
      .where(and(eq(joinRequests.firmId, firmId), eq(joinRequests.status, 'pending')));
    return NextResponse.json(
      {
        firm,
        roles: firmRoles,
        metrics: {
          members: members.length,
          roles: firmRoles.length,
          pendingRequests: pending.length,
          tag: firm?.tag || null,
          joinCode: firm?.joinCode || null,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageSettings);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const body = await req.json();
    const {
      name, nameAr, logoUrl, timezone, address, phone, email,
      licenseNumber, licenseUrl, licenseExpiry, primaryColor, secondaryColor,
      reminderAdvanceNoticeDays
    } = body;

    await db.update(firms).set({
      name,
      nameAr,
      logoUrl,
      timezone,
      address,
      phone,
      email,
      licenseNumber,
      licenseUrl,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
      primaryColor,
      secondaryColor,
      reminderAdvanceNoticeDays,
      updatedAt: new Date(),
    }).where(eq(firms.id, firmId));

    // Sync to user records
    await db.update(users).set({
      firmName: name || undefined,
      firmNameAr: nameAr || undefined
    }).where(eq(users.firmId, firmId));

    return NextResponse.json({ message: "تم التحديث بنجاح" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    // 1. Validations
    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
    if (!firm) return NextResponse.json({ message: "المكتب غير موجود" }, { status: 404 });

    // Only owner can delete
    if (firm.adminId !== payload.userId) {
      return NextResponse.json({ message: "غير مصرح لك بحذف المكتب" }, { status: 403 });
    }

    // 2. Cancel Stripe (Best Effort)
    if (firm.stripeSubscriptionId) {
      try {
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || "");
        await stripeClient.subscriptions.cancel(firm.stripeSubscriptionId);
      } catch (e) {
        console.error("Failed to cancel stripe subscription", e);
      }
    }

    // 3. OTP Verification
    const url = new URL(req.url);
    const otp = url.searchParams.get("otp");

    // Skip OTP check active during development/testing? No, strictly enforce it now.
    if (!otp) {
      return NextResponse.json({ message: "Verification code required" }, { status: 400 });
    }

    const { getRedis } = await import("@/lib/auth");
    const redis = getRedis();
    if (!redis) return NextResponse.json({ message: "Service unavailable" }, { status: 503 });

    const key = `delete_firm_otp:${firmId}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // Consume OTP so it cannot be reused
    await redis.del(key);

    // 4. Atomic DB Updates
    await db.transaction(async (tx) => {
      // Soft delete firm
      await tx.update(firms).set({
        deletedAt: new Date(),
        isActive: false,
        subscriptionStatus: 'canceled',
        updatedAt: new Date(),
      }).where(eq(firms.id, firmId));

      // Mark history in firm_users
      await tx.update(firmUsers).set({
        status: 'firm_deleted'
      }).where(eq(firmUsers.firmId, firmId));

      // Release users to be free
      await tx.update(users).set({
        firmId: null,
        firmName: null,
        firmNameAr: null
      }).where(eq(users.firmId, firmId));

      // Reject pending requests
      await tx.update(joinRequests).set({
        status: 'rejected',
        respondedBy: 'system',
        respondedAt: new Date()
      }).where(and(eq(joinRequests.firmId, firmId), eq(joinRequests.status, 'pending')));
    });

    return NextResponse.json({ message: "تم حذف المكتب بنجاح" }, { status: 200 });
  } catch (error) {
    console.error("Delete firm error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}