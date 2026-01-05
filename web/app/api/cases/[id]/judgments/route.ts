import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { judgments, cases, caseHistory } from "@/lib/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { getAccessToken } from "@/lib/auth/cookies";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";
import { requireResourcePermission } from "@/lib/rbac";
import { nanoid } from "nanoid";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id: caseId } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const offset = (page - 1) * pageSize;

        // Permission check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Get total count
        const totalRes = await (db.select({ count: sql<number>`count(*)` })
            .from(judgments as any)
            .where(and(eq((judgments as any).caseId, caseId), eq((judgments as any).firmId, payload.firmId))) as any);
        const total = Number(totalRes[0]?.count || 0);

        const data = await (db.select().from(judgments as any)
            .where(and(eq((judgments as any).caseId, caseId), eq((judgments as any).firmId, payload.firmId)))
            .orderBy(desc((judgments as any).judgmentDate))
            .limit(pageSize)
            .offset(offset) as any);

        return NextResponse.json({ items: data, total });
    } catch (error) {
        console.error("Error fetching judgments:", error);
        return NextResponse.json({ error: "Failed to fetch judgments" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id: caseId } = await params;

        // Permission check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { judgmentDate, judgmentSummary, judgmentType, judgeName, courtDecision, hearingId, attachmentUrl } = body;

        if (!judgmentDate || !judgmentSummary || !judgmentType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Auto-calculate appeal deadline (+30 days)
        const jDate = new Date(judgmentDate);
        const aDeadline = new Date(jDate);
        aDeadline.setDate(aDeadline.getDate() + 30);

        const newJudgment = {
            id: nanoid(),
            firmId: payload.firmId,
            caseId,
            hearingId: hearingId || "manual",
            judgmentDate: jDate,
            judgmentSummary,
            judgmentType,
            judgeName,
            courtDecision,
            appealDeadline: aDeadline,
            attachmentUrl,
            createdBy: payload.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [results] = await (db.insert(judgments as any).values(newJudgment).returning() as any);

        // Update case status to 'decided' and set judgmentDate
        await (db.update(cases as any)
            .set({ status: "decided", judgmentDate: jDate })
            .where(and(eq((cases as any).id, caseId), eq((cases as any).firmId, payload.firmId))) as any);

        // Log to case history
        await (db.insert(caseHistory as any).values({
            id: nanoid(),
            caseId,
            userId: payload.userId,
            action: "status_changed",
            fieldChanged: "status",
            oldValue: "active", // Simplified for now
            newValue: "decided",
            notes: `Judgment recorded: ${judgmentType}`,
            createdAt: new Date()
        }) as any);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error creating judgment:", error);
        return NextResponse.json({ error: "Failed to create judgment" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id: caseId } = await params;
        const { searchParams } = new URL(request.url);
        const judgmentId = searchParams.get("judgmentId");

        if (!judgmentId) return NextResponse.json({ error: "Missing judgmentId" }, { status: 400 });

        // Permission check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { judgmentDate, judgmentSummary, judgmentType, judgeName, courtDecision, attachmentUrl } = body;

        const updateData: any = {
            updatedAt: new Date()
        };

        if (judgmentDate) {
            const jDate = new Date(judgmentDate);
            updateData.judgmentDate = jDate;
            const aDeadline = new Date(jDate);
            aDeadline.setDate(aDeadline.getDate() + 30);
            updateData.appealDeadline = aDeadline;
        }
        if (judgmentSummary) updateData.judgmentSummary = judgmentSummary;
        if (judgmentType) updateData.judgmentType = judgmentType;
        if (judgeName !== undefined) updateData.judgeName = judgeName;
        if (courtDecision !== undefined) updateData.courtDecision = courtDecision;
        if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

        const [updated] = await (db.update(judgments as any)
            .set(updateData)
            .where(and(
                eq((judgments as any).id, judgmentId),
                eq((judgments as any).caseId, caseId),
                eq((judgments as any).firmId, payload.firmId)
            ))
            .returning() as any);

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating judgment:", error);
        return NextResponse.json({ error: "Failed to update judgment" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = request.cookies.get("access_token")?.value || (await getAccessToken());
        if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(accessToken);
        const { id: caseId } = await params;
        const { searchParams } = new URL(request.url);
        const judgmentId = searchParams.get("judgmentId");

        if (!judgmentId) return NextResponse.json({ error: "Missing judgmentId" }, { status: 400 });

        // Permission check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await (db.delete(judgments as any)
            .where(and(
                eq((judgments as any).id, judgmentId),
                eq((judgments as any).caseId, caseId),
                eq((judgments as any).firmId, payload.firmId)
            )) as any);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting judgment:", error);
        return NextResponse.json({ error: "Failed to delete judgment" }, { status: 500 });
    }
}

