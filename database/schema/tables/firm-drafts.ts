/**
 * Firm Drafts Table Schema
 * Temporary storage for firms during onboarding (before payment completion)
 */

import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

export const firmDrafts = pgTable("firm_drafts", {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerId: varchar("owner_id", { length: 64 }).notNull(),

    // Firm data (to be copied to firms table after completion)
    name: varchar("name", { length: 255 }),
    nameAr: varchar("name_ar", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    logo: text("logo"),

    // Selected plan
    selectedPlanId: varchar("selected_plan_id", { length: 64 }),
    selectedBillingPeriod: varchar("selected_billing_period", { length: 20 }).default("monthly"),

    // Stripe checkout session (for tracking payment)
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),

    // Status
    status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, payment_pending, completed, expired
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    ownerIdx: index("firm_drafts_owner_idx").on(table.ownerId),
    statusIdx: index("firm_drafts_status_idx").on(table.status),
}));

export type FirmDraft = typeof firmDrafts.$inferSelect;
export type InsertFirmDraft = typeof firmDrafts.$inferInsert;
