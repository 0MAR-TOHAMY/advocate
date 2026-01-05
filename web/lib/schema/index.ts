// Import and re-export all schema from the database package
// This assumes the database package is accessible via relative path
// Adjust the path based on your monorepo structure

export * from "@legal-case-manager/database/schema/enums";
export * from "@legal-case-manager/database/schema/tables/users";
export * from "@legal-case-manager/database/schema/tables/firms";
export * from "@legal-case-manager/database/schema/tables/clients";
export * from "@legal-case-manager/database/schema/tables/client-documents";
export * from "@legal-case-manager/database/schema/tables/general-work";
export * from "@legal-case-manager/database/schema/tables/general-work-documents";
export * from "@legal-case-manager/database/schema/tables/cases";
export * from "@legal-case-manager/database/schema/tables/case-history";
export * from "@legal-case-manager/database/schema/tables/events";
export * from "@legal-case-manager/database/schema/tables/documents";
export * from "@legal-case-manager/database/schema/tables/notes";
export * from "@legal-case-manager/database/schema/tables/case-updates";
export * from "@legal-case-manager/database/schema/tables/reminders";
export * from "@legal-case-manager/database/schema/tables/draft-documents";
export * from "@legal-case-manager/database/schema/tables/case-expenses";
export * from "@legal-case-manager/database/schema/tables/subscription-plans";

export * from "@legal-case-manager/database/schema/tables/payment-history";
export * from "@legal-case-manager/database/schema/tables/hearings";
export * from "@legal-case-manager/database/schema/tables/judgments";
export * from "@legal-case-manager/database/schema/tables/hearing-attachments";
export * from "@legal-case-manager/database/schema/tables/calendars";
export * from "@legal-case-manager/database/schema/tables/firm-users";
export * from "@legal-case-manager/database/schema/tables/roles";
export * from "@legal-case-manager/database/schema/tables/join-requests";
export * from "@legal-case-manager/database/schema/tables/permissions";
export * from "@legal-case-manager/database/schema/tables/currencies";
export * from "@legal-case-manager/database/schema/tables/push-subscriptions";
export * from "@legal-case-manager/database/schema/tables/role-permissions";
export * from "@legal-case-manager/database/schema/tables/firm-subscriptions";
export * from "@legal-case-manager/database/schema/tables/storage-add-ons";
export * from "@legal-case-manager/database/schema/tables/firm-add-ons";
export * from "@legal-case-manager/database/schema/tables/user-resource-access";
export * from "@legal-case-manager/database/schema/tables/firm-drafts";
export * from "@legal-case-manager/database/schema/tables/firm-notifications";
export * from "@legal-case-manager/database/schema/tables/chat-sessions";
export * from "@legal-case-manager/database/schema/tables/chat-messages";
export * from "@legal-case-manager/database/schema/relations";

