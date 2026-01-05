/**
 * Firm Add-ons Table Schema
 * Tracks purchased add-ons for each firm
 */

import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const firmAddOns = pgTable("firm_add_ons", {
    id: varchar("id", { length: 64 }).primaryKey(),
    firmId: varchar("firm_id", { length: 64 }).notNull(),
    addOnId: varchar("add_on_id", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    stripeSubscriptionItemId: varchar("stripe_subscription_item_id", { length: 255 }),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
}, (table) => ({
    firmIdx: index("firm_add_ons_firm_idx").on(table.firmId),
    addOnIdx: index("firm_add_ons_addon_idx").on(table.addOnId),
    statusIdx: index("firm_add_ons_status_idx").on(table.status),
}));

export type FirmAddOn = typeof firmAddOns.$inferSelect;
export type InsertFirmAddOn = typeof firmAddOns.$inferInsert;
