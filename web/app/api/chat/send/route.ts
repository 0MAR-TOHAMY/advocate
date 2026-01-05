/**
 * Chat Send API Route
 * Proxy to Chatbase API - hides API key from client
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/schema";
import { sendMessageToChatbase } from "@/lib/chatbase";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId, message } = await request.json();

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const userId = session.userId;
        const firmId = session.firmId;

        if (!firmId) {
            return NextResponse.json({ error: "No firm associated" }, { status: 400 });
        }

        let chatSession;
        let chatbaseConversationId: string | undefined;

        // If sessionId provided, verify ownership and get chatbase conversation ID
        if (sessionId) {
            const [existingSession] = await db
                .select()
                .from(chatSessions)
                .where(
                    and(
                        eq(chatSessions.id, sessionId),
                        eq(chatSessions.userId, userId),
                        eq(chatSessions.firmId, firmId)
                    )
                )
                .limit(1);

            if (!existingSession) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            chatSession = existingSession;
            chatbaseConversationId = existingSession.chatbaseConversationId || undefined;
        } else {
            // Create new session
            const newSessionId = nanoid();
            const title = message.slice(0, 100) + (message.length > 100 ? "..." : "");

            await db.insert(chatSessions).values({
                id: newSessionId,
                firmId,
                userId,
                title,
            });

            chatSession = { id: newSessionId, chatbaseConversationId: null };
        }

        // Save user message
        const userMessageId = nanoid();
        await db.insert(chatMessages).values({
            id: userMessageId,
            sessionId: chatSession.id,
            role: "user",
            content: message,
        });

        // Send to Chatbase
        const response = await sendMessageToChatbase(message, chatbaseConversationId);

        // Update session with chatbase conversation ID if new
        if (response.conversationId && !chatSession.chatbaseConversationId) {
            await db
                .update(chatSessions)
                .set({ chatbaseConversationId: response.conversationId, updatedAt: new Date() })
                .where(eq(chatSessions.id, chatSession.id));
        } else {
            await db
                .update(chatSessions)
                .set({ updatedAt: new Date() })
                .where(eq(chatSessions.id, chatSession.id));
        }

        // Save assistant message
        const assistantMessageId = nanoid();
        await db.insert(chatMessages).values({
            id: assistantMessageId,
            sessionId: chatSession.id,
            role: "assistant",
            content: response.text,
        });

        return NextResponse.json({
            sessionId: chatSession.id,
            message: {
                id: assistantMessageId,
                role: "assistant",
                content: response.text,
            },
        });
    } catch (error) {
        console.error("Chat send error:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
