import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseUpdates, caseHistory } from "@/lib/schema";
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
            .from(caseUpdates as any)
            .where(and(eq((caseUpdates as any).caseId, caseId), eq((caseUpdates as any).firmId, payload.firmId))) as any);
        const total = Number(totalRes[0]?.count || 0);

        const data = await (db.select().from(caseUpdates as any)
            .where(and(eq((caseUpdates as any).caseId, caseId), eq((caseUpdates as any).firmId, payload.firmId)))
            .orderBy(desc((caseUpdates as any).createdAt))
            .limit(pageSize)
            .offset(offset) as any);

        return NextResponse.json({ items: data, total });
    } catch (error) {
        console.error("Error fetching case updates:", error);
        return NextResponse.json({ error: "Failed to fetch case updates" }, { status: 500 });
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
        const { updateType, title, description, isImportant, nextSteps, outcome } = body;

        if (!updateType || !title || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newUpdate = {
            id: nanoid(),
            firmId: payload.firmId,
            caseId,
            updateType,
            title,
            description,
            isImportant: !!isImportant,
            nextSteps,
            outcome,
            createdBy: payload.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [results] = await (db.insert(caseUpdates as any).values(newUpdate).returning() as any);

        // Also log to case history
        await (db.insert(caseHistory as any).values({
            id: nanoid(),
            caseId,
            userId: payload.userId,
            action: "note_added", // Or a new action "update_posted"
            fieldChanged: "case_update",
            newValue: title,
            notes: `Recorded a significant update: ${title}`,
            createdAt: new Date()
        }) as any);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error creating case update:", error);
        return NextResponse.json({ error: "Failed to create case update" }, { status: 500 });
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
        const updateId = request.nextUrl.searchParams.get("updateId");

        if (!updateId) return NextResponse.json({ error: "Missing updateId" }, { status: 400 });

        // Permission check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await (db.delete(caseUpdates as any)
            .where(and(eq((caseUpdates as any).id, updateId), eq((caseUpdates as any).firmId, payload.firmId))) as any);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting case update:", error);
        return NextResponse.json({ error: "Failed to delete case update" }, { status: 500 });
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
        const updateId = request.nextUrl.searchParams.get("updateId");

        if (!updateId) return NextResponse.json({ error: "Missing updateId" }, { status: 400 });

        // Permission check
        const canEdit = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { updateType, title, description, isImportant, nextSteps, outcome } = body;

        const updateData: any = {
            updatedAt: new Date()
        };

        if (updateType) updateData.updateType = updateType;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (isImportant !== undefined) updateData.isImportant = !!isImportant;
        if (nextSteps !== undefined) updateData.nextSteps = nextSteps;
        if (outcome !== undefined) updateData.outcome = outcome;

        const [results] = await (db.update(caseUpdates as any)
            .set(updateData)
            .where(and(eq((caseUpdates as any).id, updateId), eq((caseUpdates as any).firmId, payload.firmId)))
            .returning() as any);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error updating case update:", error);
        return NextResponse.json({ error: "Failed to update case update" }, { status: 500 });
    }
}

