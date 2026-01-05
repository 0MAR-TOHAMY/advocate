/**
 * Documents Table Schema
 * Store document metadata (actual files in S3)
 */

import { pgTable, varchar, text, timestamp, integer, date, index } from "drizzle-orm/pg-core";
import { documentTypeEnum } from "../enums";

export const documents = pgTable("documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }), // Optional client-provided title
  filename: varchar("filename", { length: 500 }).notNull(), // Original filename
  description: text("description"),
  documentType: documentTypeEnum("document_type").notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL
  fileSize: integer("file_size"), // Size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  documentDate: date("document_date"), // Date on the document itself
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("documents_firm_idx").on(table.firmId),
  caseIdx: index("documents_case_idx").on(table.caseId),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
