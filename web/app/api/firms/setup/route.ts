//
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const body = await req.json();
    const { firmId, name, logoUrl, timezone, currency, settings, primaryColor, secondaryColor, address, phone, email, licenseNumber }: { firmId: string; name?: string; logoUrl?: string; timezone?: string; currency?: string; settings?: Record<string, unknown>; primaryColor?: string; secondaryColor?: string; address?: string; phone?: string; email?: string; licenseNumber?: string } = body;
    if (!firmId) return NextResponse.json({ message: "firmId مطلوب" }, { status: 400 });
    const ok = await requireAdmin(payload.userId, firmId);
    if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
    const mergedSettings = { ...(settings || {}), currency };
    await db
      .update(firms)
      .set({ name, logoUrl, timezone, settings: mergedSettings, primaryColor, secondaryColor, address, phone, email, licenseNumber, updatedAt: new Date() })
      .where(eq(firms.id, firmId));
    return NextResponse.json({ message: "تم التحديث" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
