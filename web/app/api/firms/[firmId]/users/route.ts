import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const { firmId } = await params;

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageUsers);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const members = await db
      .select({
        id: firmUsers.id,
        status: firmUsers.status,
        joinedAt: firmUsers.joinedAt,
        roleId: firmUsers.roleId,
        userId: firmUsers.userId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(firmUsers)
      .leftJoin(users, eq(firmUsers.userId, users.id))
      .where(eq(firmUsers.firmId, firmId));
    return NextResponse.json({ members }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}