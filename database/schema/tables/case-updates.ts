/**
 * Case Updates Table Schema
 * Track significant case developments and milestones
 */

import { pgTable, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { caseUpdateTypeEnum } from "../enums";

export const caseUpdates = pgTable("case_updates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  updateType: caseUpdateTypeEnum("update_type").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  outcome: text("outcome"), // For hearing results, judgments, etc.
  nextSteps: text("next_steps"), // Recommended next actions
  hearingDate: timestamp("hearing_date", { withTimezone: true }), // For hearing_scheduled updates
  judgmentDate: timestamp("judgment_date", { withTimezone: true }), // For judgment updates
  appealPeriodDays: integer("appeal_period_days"), // Appeal period in days for judgment updates
  relatedEventId: varchar("related_event_id", { length: 64 }), // Link to calendar event if applicable
  relatedDocumentId: varchar("related_document_id", { length: 64 }), // Link to document if applicable
  isImportant: boolean("is_important").default(false).notNull(), // Flag critical updates
  hasAttachment: boolean("has_attachment").default(false).notNull(), // Indicates if update has an attachment
  attachmentUrl: text("attachment_url"), // URL to attached file (stored in S3)
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("case_updates_firm_idx").on(table.firmId),
  caseIdx: index("case_updates_case_idx").on(table.caseId),
  typeIdx: index("case_updates_type_idx").on(table.updateType),
  createdIdx: index("case_updates_created_idx").on(table.createdAt),
  importantIdx: index("case_updates_important_idx").on(table.isImportant),
}));

export type CaseUpdate = typeof caseUpdates.$inferSelect;
export type InsertCaseUpdate = typeof caseUpdates.$inferInsert;
