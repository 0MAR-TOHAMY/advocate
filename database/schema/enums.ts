/**
 * PostgreSQL Enums for Legal Case Manager
 * All enum definitions extracted from MySQL schema and converted to PostgreSQL
 */

import { pgEnum } from "drizzle-orm/pg-core";

// ============================================================================
// USER & FIRM ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// ============================================================================
// CLIENT ENUMS
// ============================================================================

export const clientTypeEnum = pgEnum("client_type", [
  "individual",
  "company",
  "government",
  "organization"
]);

export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "inactive",
  "blocked"
]);

export const kycVerificationStatusEnum = pgEnum("kyc_verification_status", [
  "pending",
  "verified",
  "rejected",
  "in_review"
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "medium",
  "high"
]);

export const clientDocumentTypeEnum = pgEnum("client_document_type", [
  "national_id",
  "passport",
  "trade_license",
  "tax_certificate",
  "poa",
  "contract",
  "other"
]);

// ============================================================================
// GENERAL WORK ENUMS
// ============================================================================

export const workTypeEnum = pgEnum("work_type", [
  "consultation",
  "legal_notice",
  "contract_drafting",
  "contract_review",
  "legal_opinion",
  "document_translation",
  "notarization",
  "registration",
  "other"
]);

export const workStatusEnum = pgEnum("work_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled"
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid"
]);

export const generalWorkDocumentTypeEnum = pgEnum("general_work_document_type", [
  "contract",
  "notice",
  "opinion",
  "translation",
  "correspondence",
  "other"
]);

// ============================================================================
// CASE ENUMS
// ============================================================================

export const caseTypeEnum = pgEnum("case_type", [
  "civil",
  "criminal",
  "commercial",
  "family",
  "labor",
  "administrative",
  "appeal",
  "civil_appeal",
  "commercial_appeal",
  "criminal_appeal",
  "personal_status_appeal",
  "labor_appeal",
  "administrative_appeal",
  "execution_appeal",
  "cassation_appeal",
  "discrimination_appeal",
  "civil_cassation",
  "commercial_cassation",
  "criminal_cassation",
  "commercial_arbitration",
  "arbitration_execution",
  "arbitration_annulment",
  "payment_order",
  "travel_ban",
  "other"
]);

export const caseStatusEnum = pgEnum("case_status", [
  "active",
  "pending",
  "closed",
  "archived",
  "appeal",
  "decided",
  "suspended",
  "cassation",
  "canceled"
]);

export const caseStageEnum = pgEnum("case_stage", [
  "under_preparation",
  "first_instance",
  "appeal",
  "execution",
  "cassation",
  "other"
]);

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "appeal",
  "execution",
  "related",
  "counterclaim"
]);

// ============================================================================
// CASE HISTORY ENUMS
// ============================================================================

export const caseHistoryActionEnum = pgEnum("case_history_action", [
  "created",
  "updated",
  "status_changed",
  "document_added",
  "note_added",
  "event_scheduled",
  "assigned",
  "closed",
  "reopened"
]);

// ============================================================================
// EVENT ENUMS
// ============================================================================

export const eventTypeEnum = pgEnum("event_type", [
  "hearing",
  "meeting",
  "deadline",
  "filing",
  "consultation",
  "appeal",
  "other"
]);

export const eventStatusEnum = pgEnum("event_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled"
]);

// ============================================================================
// DOCUMENT ENUMS
// ============================================================================

export const documentTypeEnum = pgEnum("document_type", [
  "memorandum",
  "document",
  "notification",
  "expert_report",
  "other"
]);

// ============================================================================
// NOTE ENUMS
// ============================================================================

export const noteCategoryEnum = pgEnum("note_category", [
  "general",
  "strategy",
  "research",
  "client_communication",
  "court_notes",
  "evidence",
  "witness_interview",
  "legal_analysis",
  "meeting_notes",
  "todo"
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "active",
  "snoozed",
  "completed",
  "dismissed"
]);

// ============================================================================
// CASE UPDATE ENUMS
// ============================================================================

export const caseUpdateTypeEnum = pgEnum("case_update_type", [
  "hearing_scheduled",
  "hearing_result",
  "status_change",
  "judgment",
  "settlement",
  "appeal_filed",
  "document_filed",
  "payment_received",
  "deadline_approaching",
  "other"
]);

// ============================================================================
// REMINDER ENUMS
// ============================================================================

export const reminderTypeEnum = pgEnum("reminder_type", [
  "judgment_appeal",
  "document_expiry",
  "hearing",
  "deadline",
  "custom"
]);

export const relatedEntityTypeEnum = pgEnum("related_entity_type", [
  "case",
  "client",
  "event",
  "document"
]);

// ============================================================================
// EXPENSE ENUMS
// ============================================================================

export const expenseTypeEnum = pgEnum("expense_type", [
  "filing_registration_fees",
  "expert_expenses",
  "notification_expenses",
  "petition_expenses",
  "legal_notice_expenses",
  "translation_fees",
  "travel_expenses",
  "witness_fees",
  "bailiff_enforcement_fees",
  "appeal_fees",
  "consultation_fees",
  "court_transcript_fees",
  "document_preparation_fees",
  "other"
]);

// ============================================================================
// SUBSCRIPTION ENUMS
// ============================================================================

export const planTypeEnum = pgEnum("plan_type", [
  "free",
  "essential",
  "professional",
  "elite",
  "custom"
]);

export const billingPeriodEnum = pgEnum("billing_period", [
  "monthly",
  "yearly"
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "past_due",
  "canceled",
  "expired",
  "read_only"
]);

export const paymentHistoryStatusEnum = pgEnum("payment_history_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded"
]);

// ============================================================================
// HEARING ENUMS
// ============================================================================

export const hearingTypeEnum = pgEnum("hearing_type", [
  "online",
  "offline"
]);

export const judgmentTypeEnum = pgEnum("judgment_type", [
  "favor",
  "against",
  "partial"
]);

// ============================================================================
// CALENDAR ENUMS
// ============================================================================

export const calendarVisibilityEnum = pgEnum("calendar_visibility", [
  "private",
  "public",
  "shared"
]);

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "hearing",
  "meeting",
  "deadline",
  "reminder",
  "custom"
]);

export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "confirmed",
  "tentative",
  "cancelled"
]);

export const calendarEventVisibilityEnum = pgEnum("calendar_event_visibility", [
  "private",
  "public"
]);

export const attendeeRoleEnum = pgEnum("attendee_role", [
  "organizer",
  "required",
  "optional"
]);

export const attendeeStatusEnum = pgEnum("attendee_status", [
  "pending",
  "accepted",
  "declined",
  "tentative"
]);

export const reminderChannelEnum = pgEnum("reminder_channel", [
  "email",
  "in_app",
  "sms"
]);

export const reminderSentStatusEnum = pgEnum("reminder_sent_status", [
  "pending",
  "sent",
  "failed"
]);

export const aclResourceTypeEnum = pgEnum("acl_resource_type", [
  "calendar",
  "event"
]);

export const aclRoleEnum = pgEnum("acl_role", [
  "owner",
  "editor",
  "commenter",
  "viewer"
]);

export const auditEntityTypeEnum = pgEnum("audit_entity_type", [
  "calendar",
  "event",
  "attendee",
  "acl"
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete"
]);

export const syncProviderEnum = pgEnum("sync_provider", [
  "google",
  "outlook"
]);
