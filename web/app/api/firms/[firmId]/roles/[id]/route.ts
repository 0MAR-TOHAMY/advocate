import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles, firmUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRoles);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const body = await req.json();
    const { name, description, permissions, policy } = body as { name?: string; description?: string; permissions?: string[]; policy?: any };
    await db
      .update(roles)
      .set({ name, description, permissions, policy, updatedAt: new Date() })
      .where(eq(roles.id, id));
    return NextResponse.json({ message: "تم التحديث" }, { status: 200 });
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

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRoles);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const inUse = await db.select().from(firmUsers).where(eq(firmUsers.roleId, id));
    if (inUse.length > 0) return NextResponse.json({ message: "الدور مُستخدم" }, { status: 409 });
    await db.delete(roles).where(eq(roles.id, id));
    return NextResponse.json({ message: "تم الحذف" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}