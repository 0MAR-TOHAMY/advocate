/**
 * Payment History Table Schema
 * Tracks all payment transactions
 */

import { pgTable, varchar, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { paymentHistoryStatusEnum } from "../enums";

export const paymentHistory = pgTable("payment_history", {
  id: varchar("id", { length: 64 }).primaryKey(),
  subscriptionId: varchar("subscription_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: paymentHistoryStatusEnum("status").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // card, bank_transfer, etc.
  // Stripe info
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  // Metadata
  description: text("description"),
  failureReason: text("failure_reason"),
  receiptUrl: text("receipt_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  subscriptionIdx: index("payment_history_subscription_idx").on(table.subscriptionId),
  userIdx: index("payment_history_user_idx").on(table.userId),
  statusIdx: index("payment_history_status_idx").on(table.status),
}));

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;
