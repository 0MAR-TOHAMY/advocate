/**
 * Notes Table Schema
 * Case notes and comments with categorization and reminders
 */

import { pgTable, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { noteCategoryEnum, priorityEnum, reminderStatusEnum } from "../enums";

export const notes = pgTable("notes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  category: noteCategoryEnum("category").default("general"),
  tags: text("tags"), // JSON array of tags
  color: varchar("color", { length: 7 }).default("#64748b"), // Hex color for visual organization
  isPinned: boolean("is_pinned").default(false).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(), // Private notes only visible to creator
  linkedEventId: varchar("linked_event_id", { length: 64 }), // Link to specific hearing/event
  attachments: text("attachments"), // JSON array of file URLs
  checklist: text("checklist"), // JSON array of checklist items
  priority: priorityEnum("priority").default("medium"),
  reminderDate: timestamp("reminder_date", { withTimezone: true }), // Optional reminder date/time for the note
  reminderStatus: reminderStatusEnum("reminder_status").default("active"),
  reminderSnoozedUntil: timestamp("reminder_snoozed_until", { withTimezone: true }),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("notes_firm_idx").on(table.firmId),
  caseIdx: index("notes_case_idx").on(table.caseId),
  createdIdx: index("notes_created_idx").on(table.createdAt),
  pinnedIdx: index("notes_pinned_idx").on(table.isPinned),
  categoryIdx: index("notes_category_idx").on(table.category),
}));

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
