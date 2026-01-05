/**
 * Firm Subscriptions Table Schema
 * Tracks each firm's subscription (firm-centric, not user-centric)
 */

import { pgTable, varchar, timestamp, integer, index } from "drizzle-orm/pg-core";
import { subscriptionStatusEnum, billingPeriodEnum } from "../enums";

export const firmSubscriptions = pgTable("firm_subscriptions", {
    id: varchar("id", { length: 64 }).primaryKey(),
    firmId: varchar("firm_id", { length: 64 }).notNull().unique(),
    planId: varchar("plan_id", { length: 64 }).notNull(),
    status: subscriptionStatusEnum("status").default("trial").notNull(),
    billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),

    // Seat count (billable users)
    seatCount: integer("seat_count").default(1).notNull(),

    // Dates
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),

    // Downgrade request (takes effect at period end)
    downgradeToPlanId: varchar("downgrade_to_plan_id", { length: 64 }),

    // Stripe integration
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    firmIdx: index("firm_subscriptions_firm_idx").on(table.firmId),
    statusIdx: index("firm_subscriptions_status_idx").on(table.status),
}));

export type FirmSubscription = typeof firmSubscriptions.$inferSelect;
export type InsertFirmSubscription = typeof firmSubscriptions.$inferInsert;
