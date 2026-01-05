/**
 * Chat Sessions API Route
 * CRUD operations for user chat sessions with tenant isolation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/schema";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";

// GET - List all sessions for current user
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        if (!firmId) {
            return NextResponse.json({ error: "No firm associated" }, { status: 400 });
        }

        const sessions = await db
            .select()
            .from(chatSessions)
            .where(
                and(
                    eq(chatSessions.userId, userId),
                    eq(chatSessions.firmId, firmId)
                )
            )
            .orderBy(desc(chatSessions.updatedAt));

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return NextResponse.json(
            { error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}

// POST - Create a new session
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        if (!firmId) {
            return NextResponse.json({ error: "No firm associated" }, { status: 400 });
        }

        const { title } = await request.json();

        const newSession = {
            id: nanoid(),
            firmId,
            userId,
            title: title || null,
        };

        await db.insert(chatSessions).values(newSession);

        return NextResponse.json({ session: newSession }, { status: 201 });
    } catch (error) {
        console.error("Failed to create session:", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        );
    }
}
