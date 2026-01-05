import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hearings, cases } from "@/lib/schema";
import { eq, sql, asc, desc, and, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const url = new URL(req.url);

    // Query parameters
    const caseId = url.searchParams.get("caseId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const sort = url.searchParams.get("sort") || "hearingDate";
    const order = (url.searchParams.get("order") || "desc").toLowerCase();
    const search = url.searchParams.get("search")?.trim();
    const typeFilter = url.searchParams.get("type");
    const stageFilter = url.searchParams.get("stage");
    const assignedFilter = url.searchParams.get("assigned");
    const statusFilter = url.searchParams.get("status"); // upcoming, past, postponed

    // Build sort column
    const sortCol = sort === "hearingDate"
      ? hearings.hearingDate
      : sort === "hearingNumber"
        ? hearings.hearingNumber
        : sort === "createdAt"
          ? hearings.createdAt
          : hearings.hearingDate;
    const sorter = order === "asc" ? asc(sortCol as any) : desc(sortCol as any);

    // Build where conditions
    const conditions: any[] = [eq(hearings.firmId as any, payload.firmId)];
    if (caseId) conditions.push(eq(hearings.caseId as any, caseId));
    if (typeFilter) conditions.push(eq(hearings.hearingType as any, typeFilter as any));
    if (stageFilter) conditions.push(eq(hearings.stage as any, stageFilter as any));
    if (assignedFilter) conditions.push(eq(hearings.assignedTo as any, assignedFilter as any));
    if (statusFilter === "postponed") conditions.push(eq(hearings.isPostponed as any, true));
    if (statusFilter === "upcoming") conditions.push(sql`${hearings.hearingDate as any} >= NOW()`);
    if (statusFilter === "past") conditions.push(sql`${hearings.hearingDate as any} < NOW()`);

    // Search by case title or client name
    if (search) {
      conditions.push(
        or(
          like(cases.title as any, `%${search}%`),
          like(cases.clientName as any, `%${search}%`),
          like(cases.caseNumber as any, `%${search}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    // Get current time for stats
    const now = new Date();

    // Stats calculations
    const statsQuery = (db as any)
      .select({
        total: sql<number>`count(*)`,
        upcoming: sql<number>`count(*) filter (where ${hearings.isPostponed} = false and ${hearings.hearingDate} >= ${now.toISOString()})`,
        past: sql<number>`count(*) filter (where ${hearings.isPostponed} = false and ${hearings.hearingDate} < ${now.toISOString()})`,
        postponed: sql<number>`count(*) filter (where ${hearings.isPostponed} = true)`,
      })
      .from(hearings as any)
      .where(eq(hearings.firmId as any, payload.firmId));

    const [stats] = await statsQuery as any;

    // Count total (with join for search)
    const [{ count }] = await (db as any)
      .select({ count: sql<number>`count(*)` })
      .from(hearings as any)
      .leftJoin(cases as any, eq(hearings.caseId as any, (cases as any).id))
      .where(whereClause as any);

    // Fetch hearings with case info
    const data = await (db as any)
      .select({
        id: hearings.id,
        firmId: hearings.firmId,
        caseId: hearings.caseId,
        hearingNumber: hearings.hearingNumber,
        hearingDate: hearings.hearingDate,
        hearingTime: hearings.hearingTime,
        hearingType: hearings.hearingType,
        stage: hearings.stage,
        assignedTo: hearings.assignedTo,
        timeSpent: hearings.timeSpent,
        isPostponed: hearings.isPostponed,
        postponedDate: hearings.postponedDate,
        postponedTime: hearings.postponedTime,
        postponementReason: hearings.postponementReason,
        comments: hearings.comments,
        summaryByLawyer: hearings.summaryByLawyer,
        summaryToClient: hearings.summaryToClient,
        court: hearings.court,
        judge: hearings.judge,
        showInClientPortal: hearings.showInClientPortal,
        attachmentUrl: hearings.attachmentUrl,
        hasJudgment: hearings.hasJudgment,
        createdBy: hearings.createdBy,
        createdAt: hearings.createdAt,
        updatedAt: hearings.updatedAt,
        // Case info
        caseTitle: (cases as any).title,
        caseNumber: (cases as any).caseNumber,
        caseYear: (cases as any).caseYear,
        clientName: (cases as any).clientName,
        caseCourt: (cases as any).court,
        caseJudge: (cases as any).judge,
      })
      .from(hearings as any)
      .leftJoin(cases as any, eq(hearings.caseId as any, (cases as any).id))
      .where(whereClause as any)
      .orderBy(sorter)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Post-process to ensure court and judge are set (falling back to case info if hearing-specific info is missing)
    const processedData = data.map((h: any) => {
      return {
        ...h,
        court: h.court || h.caseCourt,
        judge: h.judge || h.caseJudge,
        location: h.summaryToClient
      };
    });

    return NextResponse.json({
      items: processedData,
      stats: {
        total: Number(stats?.total || 0),
        upcoming: Number(stats?.upcoming || 0),
        past: Number(stats?.past || 0),
        postponed: Number(stats?.postponed || 0)
      },
      page,
      pageSize,
      total: count
    });
  } catch (e) {
    console.error("Error fetching hearings:", e);
    return NextResponse.json({ error: "Failed to fetch hearings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const body = await req.json();

    if (!body.caseId || !body.hearingDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get next hearing number for this case
    const [{ maxNum }] = await (db as any)
      .select({ maxNum: sql<number>`max(${hearings.hearingNumber as any})` })
      .from(hearings as any)
      .where(eq(hearings.caseId as any, body.caseId));

    const nextNum = (maxNum || 0) + 1;

    const hearingDateObj = new Date(body.hearingDate);
    const timeStr = hearingDateObj.toTimeString().substring(0, 5); // "HH:MM"

    const newHearing = {
      id: nanoid(),
      firmId: payload.firmId,
      createdBy: payload.userId,
      caseId: body.caseId,
      hearingNumber: nextNum,
      hearingDate: hearingDateObj,
      hearingTime: timeStr,
      hearingType: body.hearingType || "offline",
      stage: body.stage,
      assignedTo: payload.userId,
      summaryByLawyer: body.notes,
      comments: body.title,
      court: body.court,
      judge: body.judge,
      summaryToClient: body.location,
      // Wait, I read schema and it didn't have location? 
      // Let's re-read schema.
    };

    // Checking schema again: 
    // id, firmId, caseId, hearingNumber, hearingDate, hearingTime, hearingType, stage, assignedTo, timeSpent, 
    // isPostponed, postponedDate, postponedTime, postponementReason, comments, summaryByLawyer, summaryToClient, 
    // showInClientPortal, attachmentUrl, hasJudgment, createdBy, createdAt, updatedAt

    // It does NOT have 'location' or 'title'. 
    // The 'comments' field can store the title/description.
    // 'summaryByLawyer' can store notes.
    // 'location' is missing. I should probably use 'comments' for location or add it.
    // For now I will put title in 'comments' and location in 'summaryToClient' or similar, 
    // OR I should update the schema. 
    // But updating schema requires migration which I can't run easily (I can run sql maybe).
    // I will map:
    // title -> comments (It's the closest thing to a description/title)
    // notes -> summaryByLawyer
    // location -> summaryToClient (Temporary mapping until schema update)

    const inserted = await (db as any).insert(hearings as any).values(newHearing).returning();
    return NextResponse.json({ hearing: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error("Error creating hearing:", e);
    return NextResponse.json({ error: "Failed to create hearing" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Hearing ID is required" }, { status: 400 });
    }

    // Verify hearing belongs to firm
    const [existing] = await (db as any)
      .select()
      .from(hearings as any)
      .where(and(eq(hearings.id as any, id), eq(hearings.firmId as any, payload.firmId)));

    if (!existing) {
      return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
    }

    await (db as any).delete(hearings as any).where(eq(hearings.id as any, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting hearing:", e);
    return NextResponse.json({ error: "Failed to delete hearing" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Hearing ID is required" }, { status: 400 });
    }

    // Verify hearing belongs to firm
    const [existing] = await (db as any)
      .select()
      .from(hearings as any)
      .where(and(eq(hearings.id as any, id), eq(hearings.firmId as any, payload.firmId)));

    if (!existing) {
      return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
    }

    const hearingUpdates: any = {};
    if (updates.hearingDate) {
      const d = new Date(updates.hearingDate);
      hearingUpdates.hearingDate = d;
      hearingUpdates.hearingTime = d.toTimeString().substring(0, 5);
    }
    if (updates.hearingType) hearingUpdates.hearingType = updates.hearingType;
    if (updates.stage) hearingUpdates.stage = updates.stage;
    if (updates.assignedTo) hearingUpdates.assignedTo = updates.assignedTo;
    if (updates.notes) hearingUpdates.summaryByLawyer = updates.notes;
    if (updates.title) hearingUpdates.comments = updates.title;
    if (updates.court) hearingUpdates.court = updates.court;
    if (updates.judge) hearingUpdates.judge = updates.judge;
    if (updates.location) hearingUpdates.summaryToClient = updates.location;

    // Postponement specific
    if (updates.isPostponed !== undefined) hearingUpdates.isPostponed = updates.isPostponed;
    if (updates.postponedDate) hearingUpdates.postponedDate = new Date(updates.postponedDate);
    if (updates.postponementReason) hearingUpdates.postponementReason = updates.postponementReason;

    // Handle generic fields mapping if strictly passed
    // We should map 'title' to 'comments' if passed
    if (updates.title) hearingUpdates.comments = updates.title;

    await (db as any).update(hearings as any)
      .set({ ...hearingUpdates, updatedAt: new Date() })
      .where(eq(hearings.id as any, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error updating hearing:", e);
    return NextResponse.json({ error: "Failed to update hearing" }, { status: 500 });
  }
}
