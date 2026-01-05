import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { joinRequests, users } from "@/lib/schema";
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

    const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageRequests);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

    const requests = await db
      .select({
        id: joinRequests.id,
        firmId: joinRequests.firmId,
        userId: joinRequests.userId,
        status: joinRequests.status,
        createdAt: joinRequests.createdAt,
        user: {
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(joinRequests)
      .leftJoin(users, eq(joinRequests.userId, users.id))
      .where(eq(joinRequests.firmId, firmId));
    return NextResponse.json({ requests }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}