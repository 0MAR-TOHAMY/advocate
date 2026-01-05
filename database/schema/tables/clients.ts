/**
 * Clients Table Schema
 * Centralized client information with contact info and KYC documents
 */

import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { clientTypeEnum, clientStatusEnum, kycVerificationStatusEnum, riskLevelEnum } from "../enums";

export const clients = pgTable("clients", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  clientNumber: varchar("client_number", { length: 100 }).notNull(), // Unique client identifier
  name: varchar("name", { length: 255 }).notNull(),
  clientType: clientTypeEnum("client_type").default("individual").notNull(),
  // Contact Information
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  // KYC Documents
  nationalId: varchar("national_id", { length: 100 }),
  passportNumber: varchar("passport_number", { length: 100 }),
  tradeLicenseNumber: varchar("trade_license_number", { length: 100 }), // For companies
  taxNumber: varchar("tax_number", { length: 100 }),
  // Additional Details
  notes: text("notes"),
  specialNotes: text("special_notes"), // Specialized notes added during wizard
  verificationStatus: kycVerificationStatusEnum("verification_status").default("pending").notNull(),
  riskLevel: riskLevelEnum("risk_level").default("low").notNull(),
  kycNotes: text("kyc_notes"), // Internal KYC specific notes
  status: clientStatusEnum("status").default("active").notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmIdx: index("clients_firm_idx").on(table.firmId),
  clientNumberIdx: index("clients_number_idx").on(table.clientNumber),
  statusIdx: index("clients_status_idx").on(table.status),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
