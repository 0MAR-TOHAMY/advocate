import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { joinRequests, firmUsers, firms, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { nanoid } from "nanoid";
import { requireActiveSubscription, hasUserSeats } from "@/lib/subscription/guard";
import { sendJoinRequestStatusEmail } from "@/lib/email/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string; id: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId, id } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRequests);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const [reqRow] = await db.select().from(joinRequests).where(eq(joinRequests.id, id)).limit(1);
    if (!reqRow || reqRow.firmId !== firmId) return NextResponse.json({ message: "طلب غير موجود" }, { status: 404 });
    if (reqRow.status !== "pending") return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });

    const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
    if (!firm) return NextResponse.json({ message: "شركة غير موجودة" }, { status: 404 });

    const { allowed, errorResponse } = await requireActiveSubscription();
    if (!allowed) return errorResponse;

    const canAdd = await hasUserSeats(firmId);
    if (!canAdd) {
      // Send seat limit reached notification/email to admin
      try {
        const { sendSeatLimitReachedEmail } = await import("@/lib/email/service");
        const { createFirmNotification } = await import("@/lib/notifications/service");
        const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/subscription`;

        const [admin] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (admin && firm) {
          await sendSeatLimitReachedEmail(admin.email, admin.name || "Admin", firm.name, firm.currentUsers || 0, firm.maxUsers || 0, billingUrl);
          await createFirmNotification({
            firmId,
            type: "member",
            title: "Seat Limit Reached",
            message: `You have reached the maximum number of users for your current plan (${firm.currentUsers}/${firm.maxUsers}).`,
            severity: "warning",
            linkUrl: "/dashboard/subscription"
          });
        }
      } catch (e) {
        console.error("Failed to send seat limit notifications:", e);
      }

      return NextResponse.json({ message: "تم بلوغ الحد الأقصى للمستخدمين" }, { status: 409 });
    }

    await db.insert(firmUsers).values({
      id: nanoid(),
      firmId,
      userId: reqRow.userId,
      status: "active",
    });

    await db.update(users).set({
      firmId,
      firmName: firm.name
    }).where(eq(users.id, reqRow.userId));

    await db.update(firms).set({ currentUsers: (firm.currentUsers || 0) + 1 }).where(eq(firms.id, firmId));

    await db.update(joinRequests).set({ status: "approved", respondedBy: payload.userId, respondedAt: new Date() }).where(eq(joinRequests.id, id));

    // Notify user
    try {
      const [requester] = await db.select({
        email: users.email,
        name: users.name
      })
        .from(users)
        .where(eq(users.id, reqRow.userId))
        .limit(1);

      if (requester) {
        await sendJoinRequestStatusEmail(requester.email, requester.name || "User", firm.name, "approved");
      }
    } catch (e) {
      console.error("Failed to send join approval notification", e);
    }

    return NextResponse.json({ message: "تمت الموافقة" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}