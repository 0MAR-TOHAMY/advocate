/**
 * General Work Table Schema
 * For non-case legal services: consultations, legal notices, contracts, etc.
 */

import { pgTable, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { workTypeEnum, workStatusEnum, priorityEnum, paymentStatusEnum } from "../enums";

export const generalWork = pgTable("general_work", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  clientId: varchar("client_id", { length: 64 }).notNull(), // Link to clients table
  workNumber: varchar("work_number", { length: 100 }).notNull(), // Unique work identifier
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  workType: workTypeEnum("work_type").notNull(),
  status: workStatusEnum("status").default("pending").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  // Financial Information (stored in smallest currency unit - fils/cents)
  fee: integer("fee"), // Fee in smallest currency unit (fils)
  paid: integer("paid").default(0), // Amount paid
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  // Dates
  startDate: timestamp("start_date", { withTimezone: true }),
  completionDate: timestamp("completion_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // Assignment
  assignedTo: varchar("assigned_to", { length: 64 }), // User ID
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("general_work_firm_idx").on(table.firmId),
  clientIdx: index("general_work_client_idx").on(table.clientId),
  statusIdx: index("general_work_status_idx").on(table.status),
  assignedIdx: index("general_work_assigned_idx").on(table.assignedTo),
  workNumberIdx: index("general_work_number_idx").on(table.workNumber),
}));

export type GeneralWork = typeof generalWork.$inferSelect;
export type InsertGeneralWork = typeof generalWork.$inferInsert;
