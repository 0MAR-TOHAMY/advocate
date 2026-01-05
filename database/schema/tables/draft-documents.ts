/**
 * Draft Documents Table Schema
 * Stores uploaded documents for AI-powered legal drafting and review
 */

import { pgTable, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

export const draftDocuments = pgTable("draft_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(), // pdf, docx, doc, txt
  fileSize: integer("file_size").notNull(), // in bytes
  s3Key: varchar("s3_key", { length: 512 }).notNull(), // S3 object key
  s3Url: text("s3_url").notNull(), // Public URL to access the document
  description: text("description"), // Optional user description
  tags: jsonb("tags").$type<string[]>(), // Array of tags for categorization
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("draft_documents_firm_idx").on(table.firmId),
  uploaderIdx: index("draft_documents_uploader_idx").on(table.uploadedBy),
  uploadedAtIdx: index("draft_documents_uploaded_at_idx").on(table.uploadedAt),
}));

export type DraftDocument = typeof draftDocuments.$inferSelect;
export type InsertDraftDocument = typeof draftDocuments.$inferInsert;
