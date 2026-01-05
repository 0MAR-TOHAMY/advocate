import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms } from "@/lib/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const tag = req.nextUrl.searchParams.get('tag') || '';
    const code = req.nextUrl.searchParams.get('code') || '';
    if (!tag && !code) return NextResponse.json({ message: "وسم أو رمز مطلوب" }, { status: 400 });
    const [firm] = await db.select({ id: firms.id, name: firms.name, tag: firms.tag }).from(firms).where(or(eq(firms.tag, tag), eq(firms.joinCode, code))).limit(1);
    if (!firm) return NextResponse.json({ message: "غير موجود" }, { status: 404 });
    return NextResponse.json({ firm }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}