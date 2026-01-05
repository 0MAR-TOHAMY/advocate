/**
 * Case Expenses Table Schema
 * Track all expenses related to cases
 * Includes court fees, lawyer fees, expert fees, travel costs, etc.
 */

import { pgTable, varchar, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { expenseTypeEnum } from "../enums";

export const caseExpenses = pgTable("case_expenses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  expenseType: expenseTypeEnum("expense_type").notNull(),
  customExpenseType: varchar("custom_expense_type", { length: 255 }), // Custom type when "other" is selected
  category: varchar("category", { length: 20 }).default("expense").notNull(), // "expense" or "collection"
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("AED").notNull(),
  description: text("description"),
  expenseDate: timestamp("expense_date", { withTimezone: true }).notNull(),
  attachmentId: varchar("attachment_id", { length: 64 }), // Reference to documents table for receipt/invoice
  attachmentUrl: text("attachment_url"), // Direct S3 URL for receipt/invoice
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("case_expenses_firm_idx").on(table.firmId),
  caseIdx: index("case_expenses_case_idx").on(table.caseId),
  typeIdx: index("case_expenses_type_idx").on(table.expenseType),
  dateIdx: index("case_expenses_date_idx").on(table.expenseDate),
  categoryIdx: index("case_expenses_category_idx").on(table.category),
}));

export type CaseExpense = typeof caseExpenses.$inferSelect;
export type InsertCaseExpense = typeof caseExpenses.$inferInsert;
