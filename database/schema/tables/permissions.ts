import { pgTable, varchar, text, index } from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  description: text("description"),
}, (table) => ({
  keyIdx: index("permissions_key_idx").on(table.key),
}));

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;