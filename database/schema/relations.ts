/**
 * Database Relations
 * Defines all relationships between tables using Drizzle ORM relations
 */

import { relations } from "drizzle-orm";
import { users } from "./tables/users";
import { firms } from "./tables/firms";
import { firmUsers } from "./tables/firm-users";
import { roles } from "./tables/roles";
import { joinRequests } from "./tables/join-requests";
import { clients } from "./tables/clients";
import { clientDocuments } from "./tables/client-documents";
import { generalWork } from "./tables/general-work";
import { generalWorkDocuments } from "./tables/general-work-documents";
import { cases } from "./tables/cases";
import { caseHistory } from "./tables/case-history";
import { events } from "./tables/events";
import { documents } from "./tables/documents";
import { notes } from "./tables/notes";
import { caseUpdates } from "./tables/case-updates";
import { reminders } from "./tables/reminders";
import { draftDocuments } from "./tables/draft-documents";
import { caseExpenses } from "./tables/case-expenses";
import { subscriptionPlans } from "./tables/subscription-plans";

import { firmSubscriptions } from "./tables/firm-subscriptions";
import { storageAddOns } from "./tables/storage-add-ons";
import { firmAddOns } from "./tables/firm-add-ons";
import { paymentHistory } from "./tables/payment-history";
import { hearings } from "./tables/hearings";
import { judgments } from "./tables/judgments";
import { hearingAttachments } from "./tables/hearing-attachments";
import {
  calendars,
  calendarEvents,
  eventAttendees,
  eventReminders,
  calendarAcl,
  calendarAuditLog,
  calendarSyncTokens
} from "./tables/calendars";

// ============================================================================
// FIRM RELATIONS
// ============================================================================

export const firmsRelations = relations(firms, ({ one, many }) => ({
  users: many(users),
  memberships: many(firmUsers),
  roles: many(roles),
  joinRequests: many(joinRequests),
  clients: many(clients),
  cases: many(cases),
  generalWork: many(generalWork),
  events: many(events),
  reminders: many(reminders),

  firmSubscription: one(firmSubscriptions, {
    fields: [firms.id],
    references: [firmSubscriptions.firmId],
  }),
  addOns: many(firmAddOns),
}));

// ============================================================================
// USER RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  firm: one(firms, {
    fields: [users.firmId],
    references: [firms.id],
  }),
  memberships: many(firmUsers),
  ownedCalendars: many(calendars),
  calendarEvents: many(calendarEvents),

  syncTokens: many(calendarSyncTokens),
}));

// ============================================================================
// MEMBERSHIP RELATIONS
// ============================================================================

export const firmUsersRelations = relations(firmUsers, ({ one }) => ({
  firm: one(firms, {
    fields: [firmUsers.firmId],
    references: [firms.id],
  }),
  user: one(users, {
    fields: [firmUsers.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [firmUsers.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// ROLE RELATIONS
// ============================================================================

export const rolesRelations = relations(roles, ({ one, many }) => ({
  firm: one(firms, {
    fields: [roles.firmId],
    references: [firms.id],
  }),
  // No direct many(firmUsers) needed unless querying back; can be added later
}));

// ============================================================================
// JOIN REQUEST RELATIONS
// ============================================================================

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  firm: one(firms, {
    fields: [joinRequests.firmId],
    references: [firms.id],
  }),
  user: one(users, {
    fields: [joinRequests.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// CLIENT RELATIONS
// ============================================================================

export const clientsRelations = relations(clients, ({ one, many }) => ({
  firm: one(firms, {
    fields: [clients.firmId],
    references: [firms.id],
  }),
  documents: many(clientDocuments),
  cases: many(cases),
  generalWork: many(generalWork),
}));

export const clientDocumentsRelations = relations(clientDocuments, ({ one }) => ({
  client: one(clients, {
    fields: [clientDocuments.clientId],
    references: [clients.id],
  }),
}));

// ============================================================================
// GENERAL WORK RELATIONS
// ============================================================================

export const generalWorkRelations = relations(generalWork, ({ one, many }) => ({
  firm: one(firms, {
    fields: [generalWork.firmId],
    references: [firms.id],
  }),
  client: one(clients, {
    fields: [generalWork.clientId],
    references: [clients.id],
  }),
  documents: many(generalWorkDocuments),
}));

export const generalWorkDocumentsRelations = relations(generalWorkDocuments, ({ one }) => ({
  work: one(generalWork, {
    fields: [generalWorkDocuments.workId],
    references: [generalWork.id],
  }),
}));

// ============================================================================
// CASE RELATIONS
// ============================================================================

export const casesRelations = relations(cases, ({ one, many }) => ({
  firm: one(firms, {
    fields: [cases.firmId],
    references: [firms.id],
  }),
  client: one(clients, {
    fields: [cases.clientId],
    references: [clients.id],
  }),
  parentCase: one(cases, {
    fields: [cases.parentCaseId],
    references: [cases.id],
  }),
  relatedCases: many(cases),
  history: many(caseHistory),
  events: many(events),
  documents: many(documents),
  notes: many(notes),
  updates: many(caseUpdates),
  expenses: many(caseExpenses),
  hearings: many(hearings),
}));

export const caseHistoryRelations = relations(caseHistory, ({ one }) => ({
  case: one(cases, {
    fields: [caseHistory.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseHistory.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// EVENT RELATIONS
// ============================================================================

export const eventsRelations = relations(events, ({ one }) => ({
  firm: one(firms, {
    fields: [events.firmId],
    references: [firms.id],
  }),
  case: one(cases, {
    fields: [events.caseId],
    references: [cases.id],
  }),
}));

// ============================================================================
// DOCUMENT RELATIONS
// ============================================================================

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id],
  }),
}));

// ============================================================================
// NOTE RELATIONS
// ============================================================================

export const notesRelations = relations(notes, ({ one }) => ({
  case: one(cases, {
    fields: [notes.caseId],
    references: [cases.id],
  }),
}));

// ============================================================================
// CASE UPDATE RELATIONS
// ============================================================================

export const caseUpdatesRelations = relations(caseUpdates, ({ one }) => ({
  case: one(cases, {
    fields: [caseUpdates.caseId],
    references: [cases.id],
  }),
}));

// ============================================================================
// REMINDER RELATIONS
// ============================================================================

export const remindersRelations = relations(reminders, ({ one }) => ({
  firm: one(firms, {
    fields: [reminders.firmId],
    references: [firms.id],
  }),
}));

// ============================================================================
// DRAFT DOCUMENT RELATIONS
// ============================================================================

export const draftDocumentsRelations = relations(draftDocuments, ({ one }) => ({
  firm: one(firms, {
    fields: [draftDocuments.firmId],
    references: [firms.id],
  }),
}));

// ============================================================================
// CASE EXPENSE RELATIONS
// ============================================================================

export const caseExpensesRelations = relations(caseExpenses, ({ one }) => ({
  case: one(cases, {
    fields: [caseExpenses.caseId],
    references: [cases.id],
  }),
}));


// ============================================================================
// HEARING RELATIONS
// ============================================================================

export const hearingsRelations = relations(hearings, ({ one, many }) => ({
  case: one(cases, {
    fields: [hearings.caseId],
    references: [cases.id],
  }),
  judgments: many(judgments),
  attachments: many(hearingAttachments),
}));

export const judgmentsRelations = relations(judgments, ({ one }) => ({
  case: one(cases, {
    fields: [judgments.caseId],
    references: [cases.id],
  }),
  hearing: one(hearings, {
    fields: [judgments.hearingId],
    references: [hearings.id],
  }),
}));

export const hearingAttachmentsRelations = relations(hearingAttachments, ({ one }) => ({
  hearing: one(hearings, {
    fields: [hearingAttachments.hearingId],
    references: [hearings.id],
  }),
}));

// ============================================================================
// CALENDAR RELATIONS
// ============================================================================

export const calendarsRelations = relations(calendars, ({ one, many }) => ({
  owner: one(users, {
    fields: [calendars.ownerId],
    references: [users.id],
  }),
  events: many(calendarEvents),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  calendar: one(calendars, {
    fields: [calendarEvents.calendarId],
    references: [calendars.id],
  }),
  owner: one(users, {
    fields: [calendarEvents.ownerId],
    references: [users.id],
  }),
  parentEvent: one(calendarEvents, {
    fields: [calendarEvents.parentEventId],
    references: [calendarEvents.id],
  }),
  recurringInstances: many(calendarEvents),
  attendees: many(eventAttendees),
  reminders: many(eventReminders),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventAttendees.eventId],
    references: [calendarEvents.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
}));

export const eventRemindersRelations = relations(eventReminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventReminders.eventId],
    references: [calendarEvents.id],
  }),
}));

export const calendarAclRelations = relations(calendarAcl, ({ one }) => ({
  user: one(users, {
    fields: [calendarAcl.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [calendarAcl.createdBy],
    references: [users.id],
  }),
}));

export const calendarAuditLogRelations = relations(calendarAuditLog, ({ one }) => ({
  user: one(users, {
    fields: [calendarAuditLog.userId],
    references: [users.id],
  }),
}));

export const calendarSyncTokensRelations = relations(calendarSyncTokens, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncTokens.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// FIRM SUBSCRIPTION RELATIONS
// ============================================================================

export const firmSubscriptionsRelations = relations(firmSubscriptions, ({ one }) => ({
  firm: one(firms, {
    fields: [firmSubscriptions.firmId],
    references: [firms.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [firmSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const firmAddOnsRelations = relations(firmAddOns, ({ one }) => ({
  firm: one(firms, {
    fields: [firmAddOns.firmId],
    references: [firms.id],
  }),
  addOn: one(storageAddOns, {
    fields: [firmAddOns.addOnId],
    references: [storageAddOns.id],
  }),
}));
