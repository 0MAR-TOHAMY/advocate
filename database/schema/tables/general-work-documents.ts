/**
 * General Work Documents Table Schema
 * Documents related to general work items
 */

import { pgTable, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { generalWorkDocumentTypeEnum } from "../enums";

export const generalWorkDocuments = pgTable("general_work_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  workId: varchar("work_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  documentType: generalWorkDocumentTypeEnum("document_type").notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL
  fileSize: integer("file_size"), // Size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("general_work_documents_firm_idx").on(table.firmId),
  workIdx: index("general_work_documents_work_idx").on(table.workId),
}));

export type GeneralWorkDocument = typeof generalWorkDocuments.$inferSelect;
export type InsertGeneralWorkDocument = typeof generalWorkDocuments.$inferInsert;
