/**
 * Events Table Schema
 * Calendar events for cases (hearings, meetings, deadlines)
 */

import { pgTable, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { eventTypeEnum, eventStatusEnum } from "../enums";

export const events = pgTable("events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  caseId: varchar("case_id", { length: 64 }), // Optional - can be general events
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").notNull(),
  location: varchar("location", { length: 500 }),
  meetingLink: text("meeting_link"), // Online meeting link (Zoom, Google Meet, Teams, etc.)
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  allDay: boolean("all_day").default(false).notNull(),
  reminderMinutes: integer("reminder_minutes").default(60), // Minutes before event to remind
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  status: eventStatusEnum("status").default("scheduled").notNull(),
  attendees: text("attendees"), // JSON array of attendee names/emails
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 64 }), // User ID
  scope: varchar("scope", { length: 20 }).default("personal").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("events_firm_idx").on(table.firmId),
  caseIdx: index("events_case_idx").on(table.caseId),
  startTimeIdx: index("events_start_idx").on(table.startTime),
  assignedIdx: index("events_assigned_idx").on(table.assignedTo),
  reminderIdx: index("events_reminder_idx").on(table.reminderSent, table.startTime),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
