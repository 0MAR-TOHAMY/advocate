/**
 * Firms Table Schema
 * Law firms table - multi-tenant isolation
 * Each firm has its own isolated data and customization
 */

import { pgTable, varchar, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "../enums";

export const firms = pgTable("firms", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#1e40af"), // Hex color for theming
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#3b82f6"),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Dubai").notNull(),
  reminderAdvanceNoticeDays: integer("reminder_advance_notice_days").default(7).notNull(), // Days before deadline to show reminder
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  licenseUrl: text("license_url"),
  licenseExpiry: timestamp("license_expiry", { withTimezone: true }),
  tag: varchar("tag", { length: 32 }),
  joinCode: varchar("join_code", { length: 64 }),
  adminId: varchar("admin_id", { length: 64 }),
  planId: varchar("plan_id", { length: 64 }),
  maxUsers: integer("max_users"),
  currentUsers: integer("current_users").default(0).notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial").notNull(),
  subscriptionStart: timestamp("subscription_start", { withTimezone: true }),
  subscriptionEnd: timestamp("subscription_end", { withTimezone: true }),
  settings: jsonb("settings"),
  // Storage tracking
  storageUsedBytes: varchar("storage_used_bytes", { length: 32 }).default("0"),
  maxStorageBytes: varchar("max_storage_bytes", { length: 32 }),
  // Trial tracking
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Firm = typeof firms.$inferSelect;
export type InsertFirm = typeof firms.$inferInsert;
