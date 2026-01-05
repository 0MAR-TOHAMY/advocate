import { pgTable, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const firmUsers = pgTable("firm_users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  roleId: varchar("role_id", { length: 64 }),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  customPermissions: jsonb("custom_permissions"),
  invitedBy: varchar("invited_by", { length: 64 }),
}, (table) => ({
  firmUserIdx: index("firm_users_firm_user_idx").on(table.firmId, table.userId),
  firmIdx: index("firm_users_firm_idx").on(table.firmId),
  userIdx: index("firm_users_user_idx").on(table.userId),
  roleIdx: index("firm_users_role_idx").on(table.roleId),
}));

export type FirmUser = typeof firmUsers.$inferSelect;
export type InsertFirmUser = typeof firmUsers.$inferInsert;