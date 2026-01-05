/**
 * Calendar System Tables Schema
 * Comprehensive calendar with RFC-5545 recurrence, timezone handling, sharing, and external sync
 */

import { pgTable, varchar, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import {
  calendarVisibilityEnum,
  calendarEventTypeEnum,
  calendarEventStatusEnum,
  calendarEventVisibilityEnum,
  attendeeRoleEnum,
  attendeeStatusEnum,
  reminderChannelEnum,
  reminderSentStatusEnum,
  aclResourceTypeEnum,
  aclRoleEnum,
  auditEntityTypeEnum,
  auditActionEnum,
  syncProviderEnum
} from "../enums";

// ============================================================================
// CALENDARS TABLE
// ============================================================================

export const calendars = pgTable("calendars", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // hex color
  visibility: calendarVisibilityEnum("visibility").notNull().default("private"),
  defaultTimezone: varchar("default_timezone", { length: 64 }).notNull().default("UTC"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  firmIdIdx: index("calendars_firm_idx").on(table.firmId),
  ownerIdIdx: index("calendars_owner_idx").on(table.ownerId),
}));

export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = typeof calendars.$inferInsert;

// ============================================================================
// CALENDAR EVENTS TABLE
// ============================================================================

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  calendarId: varchar("calendar_id", { length: 64 }).notNull(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  
  // Event details
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 500 }),
  
  // Time and timezone
  startUtc: timestamp("start_utc", { withTimezone: true }).notNull(), // stored in UTC
  endUtc: timestamp("end_utc", { withTimezone: true }).notNull(), // stored in UTC
  startTz: varchar("start_tz", { length: 64 }).notNull().default("UTC"), // original timezone
  endTz: varchar("end_tz", { length: 64 }).notNull().default("UTC"), // original timezone
  allDay: boolean("all_day").notNull().default(false),
  
  // Recurrence (RFC-5545)
  recurrenceRule: text("recurrence_rule"), // RRULE string
  recurrenceExceptions: jsonb("recurrence_exceptions").$type<string[]>(), // EXDATE array
  recurrenceAdditions: jsonb("recurrence_additions").$type<string[]>(), // RDATE array
  parentEventId: varchar("parent_event_id", { length: 64 }), // for recurring event instances
  
  // Event metadata
  eventType: calendarEventTypeEnum("event_type").notNull().default("custom"),
  status: calendarEventStatusEnum("status").notNull().default("confirmed"),
  visibility: calendarEventVisibilityEnum("event_visibility").notNull().default("private"),
  
  // Additional data
  tags: jsonb("tags").$type<string[]>(),
  attachments: jsonb("attachments").$type<{url: string, name: string, type: string}[]>(),
  metadata: jsonb("metadata").$type<{caseId?: string, clientId?: string, hearingId?: string, [key: string]: any}>(), // for linking to cases/hearings
  
  // Versioning and audit
  version: integer("version").notNull().default(1), // for optimistic locking
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  calendarIdIdx: index("calendar_events_calendar_idx").on(table.calendarId, table.startUtc),
  firmIdIdx: index("calendar_events_firm_idx").on(table.firmId, table.startUtc),
  ownerIdIdx: index("calendar_events_owner_idx").on(table.ownerId, table.startUtc),
  parentEventIdIdx: index("calendar_events_parent_idx").on(table.parentEventId),
  updatedAtIdx: index("calendar_events_updated_idx").on(table.updatedAt),
  eventTypeIdx: index("calendar_events_type_idx").on(table.eventType),
}));

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ============================================================================
// EVENT ATTENDEES TABLE
// ============================================================================

export const eventAttendees = pgTable("event_attendees", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventId: varchar("event_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: attendeeRoleEnum("role").notNull().default("required"),
  status: attendeeStatusEnum("attendee_status").notNull().default("pending"),
  responseAt: timestamp("response_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_attendees_event_idx").on(table.eventId),
  userIdIdx: index("event_attendees_user_idx").on(table.userId),
  emailIdx: index("event_attendees_email_idx").on(table.email),
}));

export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = typeof eventAttendees.$inferInsert;

// ============================================================================
// EVENT REMINDERS TABLE
// ============================================================================

export const eventReminders = pgTable("event_reminders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventId: varchar("event_id", { length: 64 }).notNull(),
  channel: reminderChannelEnum("channel").notNull().default("in_app"),
  offsetMinutes: integer("offset_minutes").notNull(), // minutes before event
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: reminderSentStatusEnum("reminder_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_reminders_event_idx").on(table.eventId),
  statusIdx: index("event_reminders_status_idx").on(table.status, table.sentAt),
}));

export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = typeof eventReminders.$inferInsert;

// ============================================================================
// CALENDAR ACL (Access Control List) TABLE
// ============================================================================

export const calendarAcl = pgTable("calendar_acl", {
  id: varchar("id", { length: 64 }).primaryKey(),
  resourceType: aclResourceTypeEnum("resource_type").notNull(),
  resourceId: varchar("resource_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }),
  email: varchar("email", { length: 320 }), // for external shares
  role: aclRoleEnum("acl_role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
}, (table) => ({
  resourceIdx: index("calendar_acl_resource_idx").on(table.resourceType, table.resourceId),
  userIdIdx: index("calendar_acl_user_idx").on(table.userId),
  emailIdx: index("calendar_acl_email_idx").on(table.email),
}));

export type CalendarAcl = typeof calendarAcl.$inferSelect;
export type InsertCalendarAcl = typeof calendarAcl.$inferInsert;

// ============================================================================
// CALENDAR AUDIT LOG TABLE
// ============================================================================

export const calendarAuditLog = pgTable("calendar_audit_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  entityType: auditEntityTypeEnum("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  action: auditActionEnum("action").notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  changes: jsonb("changes").$type<{before?: any, after?: any}>(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => ({
  entityIdx: index("calendar_audit_log_entity_idx").on(table.entityType, table.entityId),
  userIdIdx: index("calendar_audit_log_user_idx").on(table.userId),
  timestampIdx: index("calendar_audit_log_timestamp_idx").on(table.timestamp),
}));

export type CalendarAuditLog = typeof calendarAuditLog.$inferSelect;
export type InsertCalendarAuditLog = typeof calendarAuditLog.$inferInsert;

// ============================================================================
// CALENDAR SYNC TOKENS TABLE (for external sync)
// ============================================================================

export const calendarSyncTokens = pgTable("calendar_sync_tokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  provider: syncProviderEnum("provider").notNull(),
  accessToken: text("access_token").notNull(), // should be encrypted
  refreshToken: text("refresh_token").notNull(), // should be encrypted
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  syncToken: varchar("sync_token", { length: 500 }), // for incremental sync
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("calendar_sync_tokens_user_idx").on(table.userId),
  providerIdx: index("calendar_sync_tokens_provider_idx").on(table.provider),
}));

export type CalendarSyncToken = typeof calendarSyncTokens.$inferSelect;
export type InsertCalendarSyncToken = typeof calendarSyncTokens.$inferInsert;
