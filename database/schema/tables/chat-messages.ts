/**
 * Chat Messages Table Schema
 * Stores individual messages within chat sessions
 */

import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

export const chatMessages = pgTable("chat_messages", {
    id: varchar("id", { length: 64 }).primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    sessionIdx: index("chat_messages_session_idx").on(table.sessionId),
    createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
