/**
 * Client Documents Table Schema
 * Store KYC and other client-related documents
 */

import { pgTable, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { clientDocumentTypeEnum } from "../enums";

export const clientDocuments = pgTable("client_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  clientId: varchar("client_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  documentType: clientDocumentTypeEnum("document_type").notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL
  fileSize: integer("file_size"), // Size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }), // For documents that expire
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("client_documents_firm_idx").on(table.firmId),
  clientIdx: index("client_documents_client_idx").on(table.clientId),
  typeIdx: index("client_documents_type_idx").on(table.documentType),
}));

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;
