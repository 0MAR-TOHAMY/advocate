/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, cases } from "@/lib/schema";
import { eq, and, gte, lte, getTableColumns, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const caseId = searchParams.get("caseId");
    const eventType = searchParams.get("eventType");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    const baseQueryConditions: any[] = [eq((events as any).firmId, payload.firmId)];
    if (start) baseQueryConditions.push(gte((events as any).startTime, new Date(start)));
    if (end) baseQueryConditions.push(lte((events as any).startTime, new Date(end)));
    if (caseId) baseQueryConditions.push(eq((events as any).caseId, caseId));
    if (eventType) baseQueryConditions.push(eq((events as any).eventType, eventType as any));

    // Get total count
    const totalCountRes = await (db.select({ count: sql<number>`count(*)` })
      .from(events as any)
      .where(and(...baseQueryConditions)) as any);
    const total = Number(totalCountRes[0]?.count || 0);

    const data = await (db
      .select({
        ...getTableColumns(events as any),
        caseTitle: (cases as any).title,
        caseNumber: (cases as any).caseNumber,
      })
      .from(events as any)
      .leftJoin(cases as any, eq((events as any).caseId, (cases as any).id))
      .where(and(...baseQueryConditions))
      .orderBy(desc((events as any).startTime))
      .limit(pageSize)
      .offset(offset) as any);

    return NextResponse.json({ items: data, total });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const body = await request.json();
    const newEvent = {
      id: nanoid(),
      firmId: payload.firmId,
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : new Date(),
      endTime: body.endTime ? new Date(body.endTime) : null,
      createdBy: payload.userId,
    };

    const [result] = await (db.insert(events as any).values(newEvent).returning() as any);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
