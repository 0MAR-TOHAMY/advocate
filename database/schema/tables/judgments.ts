/**
 * Judgments Table Schema
 * Records court judgments and appeal deadlines
 */

import { pgTable, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { judgmentTypeEnum } from "../enums";

export const judgments = pgTable("judgments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  hearingId: varchar("hearing_id", { length: 64 }).notNull(), // Associated hearing
  // Judgment details
  judgmentDate: timestamp("judgment_date", { withTimezone: true }).notNull(),
  judgmentSummary: text("judgment_summary").notNull(),
  judgmentType: judgmentTypeEnum("judgment_type").notNull(),
  judgeName: varchar("judge_name", { length: 255 }),
  courtDecision: text("court_decision"),
  // Appeal tracking
  appealDeadline: timestamp("appeal_deadline", { withTimezone: true }).notNull(), // Auto-calculated: judgmentDate + 30 days
  appealReminderCreated: boolean("appeal_reminder_created").default(false).notNull(),
  // Attachments
  attachmentUrl: text("attachment_url"),
  // Metadata
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("judgments_firm_idx").on(table.firmId),
  caseIdx: index("judgments_case_idx").on(table.caseId),
  hearingIdx: index("judgments_hearing_idx").on(table.hearingId),
  appealDeadlineIdx: index("judgments_appeal_deadline_idx").on(table.appealDeadline),
}));

export type Judgment = typeof judgments.$inferSelect;
export type InsertJudgment = typeof judgments.$inferInsert;
