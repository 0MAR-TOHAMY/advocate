import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { nanoid } from "nanoid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRoles);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const data = await db.select().from(roles).where(eq(roles.firmId, firmId));
    return NextResponse.json({ roles: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRoles);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const body = await req.json();
    const { name, description, permissions, policy } = body as { name: string; description?: string; permissions?: string[]; policy?: any };
    if (!name) return NextResponse.json({ message: "الاسم مطلوب" }, { status: 400 });
    await db.insert(roles).values({
      id: nanoid(),
      firmId,
      name,
      description: description || "",
      permissions: permissions || [],
      policy: policy || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({ message: "تم الإنشاء" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}