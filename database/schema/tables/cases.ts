/**
 * Cases Table Schema
 * Core entity for legal case management with full client and party information
 */

import { pgTable, varchar, text, timestamp, integer, boolean, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { caseTypeEnum, caseStatusEnum, priorityEnum, caseStageEnum, clientTypeEnum, relationshipTypeEnum } from "../enums";

// Type definitions for JSON fields
export type AdditionalParty = {
  name: string;
  capacity?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export const cases = pgTable("cases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  clientId: varchar("client_id", { length: 64 }).notNull(), // Link to clients table
  caseNumber: varchar("case_number", { length: 100 }), // Unique case identifier (optional)
  internalReferenceNumber: varchar("internal_reference_number", { length: 100 }), // Internal office reference number (optional)
  caseYear: integer("case_year").notNull(), // Year of the case
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  caseType: caseTypeEnum("case_type").notNull(),
  customCaseType: varchar("custom_case_type", { length: 255 }), // Custom case type when "other" is selected
  claimAmount: decimal("claim_amount", { precision: 15, scale: 2 }), // Claim amount for the case
  currency: varchar("currency", { length: 10 }), // Currency code (e.g., USD, EUR, SAR)
  collectedAmount: decimal("collected_amount", { precision: 15, scale: 2 }).default("0"), // Amount collected so far
  status: caseStatusEnum("status").default("active").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  caseStage: caseStageEnum("case_stage").default("under_preparation").notNull(),
  customCaseStage: varchar("custom_case_stage", { length: 255 }), // Custom stage when "other" is selected
  relatedCaseGroupId: varchar("related_case_group_id", { length: 64 }), // ID to group related cases together for synchronization
  // Legacy client fields (kept for backward compatibility, but clientId should be used)
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientType: clientTypeEnum("client_type").default("individual"),
  clientPhone: varchar("client_phone", { length: 50 }),
  clientEmail: varchar("client_email", { length: 320 }),
  clientAddress: text("client_address"),
  clientCapacity: varchar("client_capacity", { length: 100 }), // Client's capacity in the case (plaintiff, defendant, etc.)
  additionalClients: jsonb("additional_clients").$type<AdditionalParty[]>(), // Additional clients beyond the primary one
  opposingParty: varchar("opposing_party", { length: 255 }),
  opposingPartyCapacity: varchar("opposing_party_capacity", { length: 100 }), // Opposing party's capacity
  opposingPartyPhone: varchar("opposing_party_phone", { length: 50 }),
  opposingPartyEmail: varchar("opposing_party_email", { length: 320 }),
  opposingPartyAddress: text("opposing_party_address"),
  additionalParties: jsonb("additional_parties").$type<AdditionalParty[]>(), // Additional opposing parties beyond the primary one
  // Case relationship fields
  parentCaseId: varchar("parent_case_id", { length: 64 }), // Reference to parent case if this is a related case
  relationshipType: relationshipTypeEnum("relationship_type"),
  poaDocumentId: varchar("poa_document_id", { length: 64 }), // Reference to documents table
  poaExpiryDate: timestamp("poa_expiry_date", { withTimezone: true }),
  poaReminderSent: boolean("poa_reminder_sent").default(false).notNull(),
  court: varchar("court", { length: 255 }),
  judge: varchar("judge", { length: 255 }),
  filingDate: timestamp("filing_date", { withTimezone: true }),
  nextHearingDate: timestamp("next_hearing_date", { withTimezone: true }), // Next scheduled hearing date
  lastHearingDate: timestamp("last_hearing_date", { withTimezone: true }), // Last hearing date (past hearing)
  judgmentDate: timestamp("judgment_date", { withTimezone: true }), // Date of judgment if issued
  closedDate: timestamp("closed_date", { withTimezone: true }),
  assignedTo: varchar("assigned_to", { length: 64 }), // User ID
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  password: varchar("password", { length: 255 }), // Hashed password for case protection
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("cases_firm_idx").on(table.firmId),
  clientIdx: index("cases_client_idx").on(table.clientId),
  statusIdx: index("cases_status_idx").on(table.status),
  assignedIdx: index("cases_assigned_idx").on(table.assignedTo),
  caseNumberIdx: index("cases_number_idx").on(table.caseNumber),
  parentCaseIdx: index("cases_parent_idx").on(table.parentCaseId),
}));

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
