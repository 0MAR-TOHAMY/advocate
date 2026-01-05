import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const joinRequests = pgTable("join_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  respondedBy: varchar("responded_by", { length: 64 }),
}, (table) => ({
  firmIdx: index("join_requests_firm_idx").on(table.firmId),
  userIdx: index("join_requests_user_idx").on(table.userId),
  statusIdx: index("join_requests_status_idx").on(table.status),
}));

export type JoinRequest = typeof joinRequests.$inferSelect;
export type InsertJoinRequest = typeof joinRequests.$inferInsert;