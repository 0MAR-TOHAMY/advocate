/**
 * Storage Add-ons Table Schema
 * Predefined storage add-on packages available for purchase
 */

import { pgTable, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";

export const storageAddOns = pgTable("storage_add_ons", {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    storageSizeGB: integer("storage_size_gb").notNull(),
    priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type StorageAddOn = typeof storageAddOns.$inferSelect;
export type InsertStorageAddOn = typeof storageAddOns.$inferInsert;
