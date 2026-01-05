import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases } from "@/lib/schema";
import { sql, inArray, and, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ firmId: string }>(accessToken);
    const url = new URL(req.url);
    const yearsParam = url.searchParams.get("years");
    let years: number[];

    if (yearsParam) {
      years = yearsParam
        .split(",")
        .map((y) => parseInt(y.trim(), 10))
        .filter((y) => !Number.isNaN(y));
    } else {
      const current = new Date().getFullYear();
      years = [current - 1, current, current + 1];
    }

    if (years.length === 0) {
      return NextResponse.json({ byYear: {}, years });
    }

    const rows = await db
      .select({ year: cases.caseYear, count: sql<number>`count(*)::int` })
      .from(cases)
      .where(and(inArray(cases.caseYear, years), eq(cases.firmId, payload.firmId)))
      .groupBy(cases.caseYear);

    const byYear: Record<number, number> = {};
    for (const r of rows as Array<{ year: number; count: number }>) {
      byYear[r.year] = r.count;
    }

    for (const y of years) {
      if (byYear[y] == null) byYear[y] = 0;
    }

    return NextResponse.json({ byYear, years });
  } catch (e) {
    console.error("Failed to fetch cases by year:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
