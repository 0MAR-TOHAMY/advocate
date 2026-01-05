/**
 * Hearings Table Schema
 * Tracks all court hearings for cases
 * Includes postponement tracking and hearing details
 */

import { pgTable, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { hearingTypeEnum } from "../enums";

export const hearings = pgTable("hearings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  // Hearing details
  hearingNumber: integer("hearing_number").notNull(), // Sequential number (H1, H2, H3...)
  hearingDate: timestamp("hearing_date", { withTimezone: true }).notNull(),
  hearingTime: varchar("hearing_time", { length: 10 }).notNull(), // e.g., "10:00"
  hearingType: hearingTypeEnum("hearing_type").default("offline").notNull(),
  stage: varchar("stage", { length: 255 }), // Case stage at time of hearing
  court: varchar("court", { length: 255 }), // Specific court for this hearing
  judge: varchar("judge", { length: 255 }), // Specific judge for this hearing
  // Assignment
  assignedTo: varchar("assigned_to", { length: 64 }), // User ID of assigned lawyer
  timeSpent: varchar("time_spent", { length: 50 }), // e.g., "1:00" (1 hour)
  // Postponement
  isPostponed: boolean("is_postponed").default(false).notNull(),
  postponedDate: timestamp("postponed_date", { withTimezone: true }),
  postponedTime: varchar("postponed_time", { length: 10 }),
  postponementReason: text("postponement_reason"),
  // Comments and Summary
  comments: text("comments"), // Comments for next hearing
  summaryByLawyer: text("summary_by_lawyer"), // Internal notes for lawyer
  summaryToClient: text("summary_to_client"), // Summary visible to client
  // Visibility
  showInClientPortal: boolean("show_in_client_portal").default(false).notNull(),
  // Attachment
  attachmentUrl: text("attachment_url"), // URL to uploaded document/file
  // Judgment
  hasJudgment: boolean("has_judgment").default(false).notNull(),
  // Metadata
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("hearings_firm_idx").on(table.firmId),
  caseIdx: index("hearings_case_idx").on(table.caseId),
  dateIdx: index("hearings_date_idx").on(table.hearingDate),
  assignedIdx: index("hearings_assigned_idx").on(table.assignedTo),
}));

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = typeof hearings.$inferInsert;
