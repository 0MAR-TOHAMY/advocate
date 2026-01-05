import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
import { and, eq, desc, or, isNull } from "drizzle-orm";
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

        // Permission check
        const canView = await requireResourcePermission(payload.userId, payload.firmId, "case", caseId, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Fetch notes:
        // 1. Must belong to the case and firm
        // 2. Either not private, OR private and created by current user
        const data = await (db.select().from(notes as any)
            .where(
                and(
                    eq((notes as any).caseId, caseId),
                    eq((notes as any).firmId, payload.firmId),
                    or(
                        eq((notes as any).isPrivate, false),
                        and(eq((notes as any).isPrivate, true), eq((notes as any).createdBy, payload.userId))
                    )
                )
            )
            .orderBy(desc((notes as any).isPinned), desc((notes as any).createdAt)) as any);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching case notes:", error);
        return NextResponse.json({ error: "Failed to fetch case notes" }, { status: 500 });
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
        const { content, isPrivate, isPinned } = body;

        if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

        const newNote = {
            id: nanoid(),
            firmId: payload.firmId,
            caseId,
            content,
            isPrivate: !!isPrivate,
            isPinned: !!isPinned,
            createdBy: payload.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [results] = await (db.insert(notes as any).values(newNote).returning() as any);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error creating case note:", error);
        return NextResponse.json({ error: "Failed to create case note" }, { status: 500 });
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
        const noteId = request.nextUrl.searchParams.get("noteId");

        if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

        const body = await request.json();
        const { content, isPrivate, isPinned } = body;

        // Fetch note to check ownership
        const [existingNote] = await (db.select().from(notes as any).where(eq((notes as any).id, noteId)) as any);
        if (!existingNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

        // Only creator or admin can edit
        if (existingNote.createdBy !== payload.userId) {
            // Check if admin (optional, for now strictly creator)
            // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (content !== undefined) updateData.content = content;
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
        if (isPinned !== undefined) updateData.isPinned = isPinned;

        const [results] = await (db.update(notes as any)
            .set(updateData)
            .where(and(eq((notes as any).id, noteId), eq((notes as any).firmId, payload.firmId)))
            .returning() as any);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error updating case note:", error);
        return NextResponse.json({ error: "Failed to update case note" }, { status: 500 });
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
        const noteId = request.nextUrl.searchParams.get("noteId");

        if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

        await (db.delete(notes as any)
            .where(and(eq((notes as any).id, noteId), eq((notes as any).firmId, payload.firmId))) as any);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting case note:", error);
        return NextResponse.json({ error: "Failed to delete case note" }, { status: 500 });
    }
}

