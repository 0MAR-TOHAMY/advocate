import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ firmId: string }>(accessToken);
    const { id } = await ctx.params;

    const [c] = await db
      .select({
        id: cases.id,
        title: cases.title,
        caseNumber: cases.caseNumber,
        caseYear: cases.caseYear,
        caseType: cases.caseType,
        status: cases.status,
        caseStage: cases.caseStage,
        nextHearingDate: cases.nextHearingDate,
        lastHearingDate: cases.lastHearingDate,
        judgmentDate: cases.judgmentDate,
      })
      .from(cases)
      .where(and(eq(cases.id, id), eq(cases.firmId, payload.firmId)))
      .limit(1);

    if (!c) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json({ case: c });
  } catch (error) {
    console.error("Portal case error:", error);
    return NextResponse.json({ error: "فشل جلب القضية" }, { status: 500 });
  }
}

