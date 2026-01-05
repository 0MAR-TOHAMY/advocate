/**
 * Database Schema Index
 * Central export point for all schema definitions
 */

// Export all enums
export * from "./enums";

// Export all tables
export * from "./tables/users";
export * from "./tables/firms";
export * from "./tables/clients";
export * from "./tables/client-documents";
export * from "./tables/general-work";
export * from "./tables/general-work-documents";
export * from "./tables/cases";
export * from "./tables/case-history";
export * from "./tables/events";
export * from "./tables/documents";
export * from "./tables/notes";
export * from "./tables/case-updates";
export * from "./tables/reminders";
export * from "./tables/draft-documents";
export * from "./tables/case-expenses";
export * from "./tables/subscription-plans";

export * from "./tables/payment-history";
export * from "./tables/hearings";
export * from "./tables/judgments";
export * from "./tables/hearing-attachments";
export * from "./tables/calendars";
export * from "./tables/firm-users";
export * from "./tables/roles";
export * from "./tables/join-requests";
export * from "./tables/permissions";
export * from "./tables/currencies";
export * from "./tables/push-subscriptions";
export * from "./tables/role-permissions";
export * from "./tables/firm-subscriptions";
export * from "./tables/storage-add-ons";
export * from "./tables/firm-add-ons";
export * from "./tables/firm-notifications";
export * from "./tables/firm-drafts";
export * from "./tables/user-resource-access";
export * from "./tables/chat-sessions";
export * from "./tables/chat-messages";

// Export all relations
export * from "./relations";
