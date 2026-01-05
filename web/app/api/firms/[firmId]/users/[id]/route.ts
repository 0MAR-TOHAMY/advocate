import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, firms, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string; id: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId, id } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageUsers);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const body = await req.json();
    const { roleId, status } = body as { roleId?: string | null; status?: "active" | "inactive" | "pending" };
    const [row] = await db
      .update(firmUsers)
      .set({ roleId: roleId ?? null, status: status || undefined })
      .where(and(eq(firmUsers.id, id), eq(firmUsers.firmId, firmId)))
      .returning();
    if (!row) return NextResponse.json({ message: "غير موجود" }, { status: 404 });
    return NextResponse.json({ member: row }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string; id: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId, id } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageUsers);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    // Don't allow deleting self if owner
    if (payload.userId === id) {
      // Check if they are the admin of the firm
      const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
      if (firm.adminId === id) {
        return NextResponse.json({ message: "لا يمكنك حذف نفسك لأنك مالك المكتب" }, { status: 400 });
      }
    }

    const [row] = await db
      .delete(firmUsers)
      .where(and(eq(firmUsers.id, id), eq(firmUsers.firmId, firmId)))
      .returning();

    if (!row) return NextResponse.json({ message: "غير موجود" }, { status: 404 });

    // Update user record to clear firmId, firmName, firmNameAr
    await db.update(users).set({
      firmId: null,
      firmName: null,
      firmNameAr: null,
      updatedAt: new Date(),
    }).where(eq(users.id, row.userId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
