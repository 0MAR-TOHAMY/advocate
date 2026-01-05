/**
 * Case History Table Schema
 * Audit trail for all case changes
 */

import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { caseHistoryActionEnum } from "../enums";

export const caseHistory = pgTable("case_history", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  action: caseHistoryActionEnum("action").notNull(),
  fieldChanged: varchar("field_changed", { length: 100 }), // Which field was changed
  oldValue: text("old_value"),
  newValue: text("new_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseIdx: index("case_history_case_idx").on(table.caseId),
  userIdx: index("case_history_user_idx").on(table.userId),
  createdIdx: index("case_history_created_idx").on(table.createdAt),
}));

export type CaseHistory = typeof caseHistory.$inferSelect;
export type InsertCaseHistory = typeof caseHistory.$inferInsert;
