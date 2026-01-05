/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const body = await req.json();
    const { firmId, roleId, department, phone, customPermissions } = body as any;
    if (!firmId) return NextResponse.json({ message: "firmId مطلوب" }, { status: 400 });
    await db
      .update(firmUsers)
      .set({ roleId, customPermissions })
      .where(and(eq(firmUsers.userId, payload.userId), eq(firmUsers.firmId, firmId)));
    await db.update(users).set({ department, phone }).where(eq(users.id, payload.userId));
    return NextResponse.json({ message: "تم إكمال الملف" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}