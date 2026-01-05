/**
 * Subscription Plans Table Schema
 * Defines available subscription tiers: Free, Essential, Professional, Elite, Custom
 * Pricing is per user per month (stored in cents for precision)
 */

import { pgTable, varchar, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { planTypeEnum, billingPeriodEnum } from "../enums";

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  planType: planTypeEnum("plan_type").notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // Pricing (per user per month in USD cents)
  pricePerUserMonthly: integer("price_per_user_monthly").notNull(), // in cents, e.g. 2900 = $29
  pricePerUserYearly: integer("price_per_user_yearly"), // in cents (yearly total per user), null for free
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),

  // User limits
  minUsers: integer("min_users").default(1).notNull(),
  maxUsers: integer("max_users"), // null = unlimited or contact sales

  // Storage limits (per user in GB)
  storagePerUserGB: integer("storage_per_user_gb"), // null = unlimited

  // Trial (only for free plan)
  trialDays: integer("trial_days").default(0).notNull(),

  // Flags
  isContactSales: boolean("is_contact_sales").default(false).notNull(), // true for Custom plan
  isActive: boolean("is_active").default(true).notNull(),

  // Stripe integration
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  stripeProductId: varchar("stripe_product_id", { length: 255 }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
