import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";

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
    const body = await req.json();
    const { tag } = body as { tag?: string };
    if (!tag || !tag.trim()) return NextResponse.json({ message: "الوسم مطلوب" }, { status: 400 });
    const [dup] = await db.select().from(firms).where(eq(firms.tag, tag)).limit(1);
    if (dup && dup.id !== firmId) return NextResponse.json({ message: "الوسم مستخدم" }, { status: 409 });
    await db.update(firms).set({ tag, updatedAt: new Date() }).where(eq(firms.id, firmId));
    return NextResponse.json({ tag }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
