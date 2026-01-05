import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { joinRequests, users, firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
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
    if (!reqRow) return NextResponse.json({ message: "طلب غير موجود" }, { status: 404 });

    await db
      .update(joinRequests)
      .set({ status: "rejected", respondedBy: payload.userId, respondedAt: new Date() })
      .where(eq(joinRequests.id, id));

    // Notify user
    try {
      const [requester] = await db.select({
        email: users.email,
        name: users.name
      })
        .from(users)
        .where(eq(users.id, reqRow.userId))
        .limit(1);

      const [firm] = await db.select({ name: firms.name }).from(firms).where(eq(firms.id, firmId)).limit(1);

      if (requester && firm) {
        await sendJoinRequestStatusEmail(requester.email, requester.name || "User", firm.name, "rejected");
      }
    } catch (e) {
      console.error("Failed to send join rejection notification", e);
    }

    return NextResponse.json({ message: "تم الرفض" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}