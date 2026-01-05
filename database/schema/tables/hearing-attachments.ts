/**
 * Hearing Attachments Table Schema
 * Documents uploaded for hearings
 */

import { pgTable, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const hearingAttachments = pgTable("hearing_attachments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  hearingId: varchar("hearing_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("hearing_attachments_firm_idx").on(table.firmId),
  hearingIdx: index("hearing_attachments_hearing_idx").on(table.hearingId),
}));

export type HearingAttachment = typeof hearingAttachments.$inferSelect;
export type InsertHearingAttachment = typeof hearingAttachments.$inferInsert;
