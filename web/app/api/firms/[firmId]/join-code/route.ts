import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { nanoid } from "nanoid";

export async function POST(
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
    const code = nanoid(8);
    await db.update(firms).set({ joinCode: code, updatedAt: new Date() }).where(eq(firms.id, firmId));
    return NextResponse.json({ joinCode: code }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
