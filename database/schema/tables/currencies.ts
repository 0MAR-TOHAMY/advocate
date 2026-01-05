import { pgTable, varchar, integer, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";

export const currencies = pgTable("currencies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ISO 4217
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  symbolPosition: varchar("symbol_position", { length: 10 }).default("before").notNull(), // 'before' | 'after'
  decimalPlaces: integer("decimal_places").default(2).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).default("1").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  codeIdx: index("currencies_code_idx").on(table.code),
  isActiveIdx: index("currencies_is_active_idx").on(table.isActive),
}));

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;
