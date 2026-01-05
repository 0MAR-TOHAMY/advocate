import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hearings, cases, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;

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
        showInClientPortal: hearings.showInClientPortal,
        attachmentUrl: hearings.attachmentUrl,
        hasJudgment: hearings.hasJudgment,
        court: hearings.court,
        judge: hearings.judge,
        createdBy: hearings.createdBy,
        createdAt: hearings.createdAt,
        updatedAt: hearings.updatedAt,
        // Case info
        caseTitle: (cases as any).title,
        caseNumber: (cases as any).caseNumber,
        caseYear: (cases as any).caseYear,
        clientName: (cases as any).clientName,
        clientId: (cases as any).clientId,
        caseCourt: (cases as any).court,
        caseJudge: (cases as any).judge,
        assignedToName: (users as any).name,
      })
      .from(hearings as any)
      .leftJoin(cases as any, eq(hearings.caseId as any, (cases as any).id))
      .leftJoin(users as any, eq(hearings.assignedTo as any, (users as any).id))
      .where(and(eq(hearings.id as any, id as any), eq(hearings.firmId as any, payload.firmId as any)));

    if (!data.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const hearing = {
      ...data[0],
      court: data[0].court || data[0].caseCourt,
      judge: data[0].judge || data[0].caseJudge
    };
    return NextResponse.json({ hearing });
  } catch {
    return NextResponse.json({ error: "Failed to fetch hearing" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    const body = await req.json();

    // Only allow valid fields to be updated
    const allowedFields = [
      'hearingDate', 'hearingTime', 'hearingType', 'stage', 'assignedTo',
      'timeSpent', 'isPostponed', 'postponedDate', 'postponedTime', 'postponementReason',
      'comments', 'summaryByLawyer', 'summaryToClient', 'showInClientPortal',
      'attachmentUrl', 'hasJudgment', 'court', 'judge'
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) {
        let value = body[key];
        // Convert date strings to Date objects
        if ((key === 'hearingDate' || key === 'postponedDate') && value) {
          value = new Date(value);
        }
        updateData[key] = value;
      }
    }

    // Add updatedAt
    updateData.updatedAt = new Date();

    const updated = await (db as any).update(hearings as any).set(updateData).where(and(eq(hearings.id as any, id as any), eq(hearings.firmId as any, payload.firmId as any))).returning();
    return NextResponse.json({ hearing: updated[0] });
  } catch (error) {
    console.error("Failed to update hearing:", error);
    return NextResponse.json({ error: "Failed to update hearing" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    await (db as any).delete(hearings as any).where(and(eq(hearings.id as any, id as any), eq(hearings.firmId as any, payload.firmId as any)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete hearing" }, { status: 500 });
  }
}
