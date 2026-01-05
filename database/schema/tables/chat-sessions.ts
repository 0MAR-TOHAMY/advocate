/**
 * Chat Sessions Table Schema
 * Stores per-user conversation sessions for the AI drafting assistant
 */

import { pgTable, varchar, text, timestamp, index, boolean } from "drizzle-orm/pg-core";

export const chatSessions = pgTable("chat_sessions", {
    id: varchar("id", { length: 64 }).primaryKey(),
    firmId: varchar("firm_id", { length: 64 }).notNull(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }), // Auto-generated from first message
    chatbaseConversationId: varchar("chatbase_conversation_id", { length: 128 }), // Chatbase's conversation ID
    isFavorite: boolean("is_favorite").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    firmIdx: index("chat_sessions_firm_idx").on(table.firmId),
    userIdx: index("chat_sessions_user_idx").on(table.userId),
    createdAtIdx: index("chat_sessions_created_at_idx").on(table.createdAt),
}));

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
