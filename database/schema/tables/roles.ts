import { pgTable, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firmId: varchar("firm_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>(),
  // Granular ABAC/ACL policy definition
  policy: jsonb("policy").$type<{
    resources: {
      type: string;
      resourceId: string;
      actions: string[];
    }[];
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  firmNameIdx: index("roles_firm_name_idx").on(table.firmId, table.name),
}));

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;