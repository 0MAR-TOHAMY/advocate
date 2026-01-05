import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hearings } from "@/lib/schema";
import { and, eq, sql, asc, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ firmId: string }>(accessToken);

    const url = new URL(req.url);
    const caseId = url.searchParams.get("caseId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const sort = url.searchParams.get("sort") || "hearingDate";
    const order = (url.searchParams.get("order") || "desc").toLowerCase();

    const sortCol = sort === "hearingDate"
      ? hearings.hearingDate
      : sort === "hearingNumber"
      ? hearings.hearingNumber
      : hearings.createdAt;
    const sorter = order === "asc" ? asc(sortCol) : desc(sortCol);

    const cond = caseId
      ? and(eq(hearings.firmId, payload.firmId), eq(hearings.caseId, caseId), eq(hearings.showInClientPortal, true))
      : and(eq(hearings.firmId, payload.firmId), eq(hearings.showInClientPortal, true));

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(hearings).where(cond);
    const items = await db.select().from(hearings).where(cond).orderBy(sorter).limit(pageSize).offset((page - 1) * pageSize);

    return NextResponse.json({ items, page, pageSize, total: count });
  } catch (error) {
    console.error("Portal hearings error:", error);
    return NextResponse.json({ error: "فشل جلب جلسات البوابة" }, { status: 500 });
  }
}

