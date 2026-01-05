/**
 * Individual Chat Session API Route
 * Delete session and get messages with tenant isolation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

// GET - Fetch messages for a session
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        if (!firmId) {
            return NextResponse.json({ error: "No firm associated" }, { status: 400 });
        }

        // Verify session ownership
        const [chatSession] = await db
            .select()
            .from(chatSessions as any)
            .where(
                and(
                    eq(chatSessions.id as any, sessionId),
                    eq(chatSessions.userId as any, userId),
                    eq(chatSessions.firmId as any, firmId)
                )
            )
            .limit(1);

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Get messages
        const messages = await db
            .select()
            .from(chatMessages as any)
            .where(eq(chatMessages.sessionId as any, sessionId))
            .orderBy(asc(chatMessages.createdAt as any));

        return NextResponse.json({ session: chatSession, messages });
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// PUT - Update session (Rename / Pin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        const body = await request.json();
        const { title, isFavorite } = body;

        // Verify session ownership
        const [chatSession] = await db
            .select()
            .from(chatSessions as any)
            .where(
                and(
                    eq(chatSessions.id as any, sessionId),
                    eq(chatSessions.userId as any, userId),
                    eq(chatSessions.firmId as any, firmId)
                )
            )
            .limit(1);

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Update fields
        const updateData: any = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

        await db
            .update(chatSessions as any)
            .set(updateData)
            .where(eq(chatSessions.id as any, sessionId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update session:", error);
        return NextResponse.json(
            { error: "Failed to update session" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a session and its messages
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        if (!firmId) {
            return NextResponse.json({ error: "No firm associated" }, { status: 400 });
        }

        // Verify session ownership
        const [chatSession] = await db
            .select()
            .from(chatSessions as any)
            .where(
                and(
                    eq(chatSessions.id as any, sessionId),
                    eq(chatSessions.userId as any, userId),
                    eq(chatSessions.firmId as any, firmId)
                )
            )
            .limit(1);

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Delete messages first
        await db.delete(chatMessages as any).where(eq(chatMessages.sessionId as any, sessionId));

        // Delete session
        await db.delete(chatSessions as any).where(eq(chatSessions.id as any, sessionId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete session:", error);
        return NextResponse.json(
            { error: "Failed to delete session" },
            { status: 500 }
        );
    }
}
