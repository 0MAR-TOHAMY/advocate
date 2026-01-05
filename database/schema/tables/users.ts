import { pgTable, varchar, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { userRoleEnum } from "../enums";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),

  passwordHash: text("password_hash"),
  loginMethod: varchar("login_method", { length: 64 }).default("local"),
  googleId: varchar("google_id", { length: 255 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),

  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiresAt: timestamp("reset_token_expires_at", { withTimezone: true }),

  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),

  role: userRoleEnum("role").default("user").notNull(),
  firmId: varchar("firm_id", { length: 64 }),
  firmName: varchar("firm_name", { length: 255 }),
  firmNameAr: varchar("firm_name_ar", { length: 255 }),

  isActive: boolean("is_active").default(true).notNull(),
  usedFreeTrial: boolean("used_free_trial").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),

  preferences: jsonb("preferences").$type<{
    language?: "ar" | "en";
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
    autoArchive?: boolean;
  }>().default({
    language: "ar",
    theme: "system",
    notifications: true,
    autoArchive: false,
  }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }),
}, (table) => ({
  firmIdx: index("users_firm_idx").on(table.firmId),
  emailIdx: index("users_email_idx").on(table.email),
  googleIdIdx: index("users_google_id_idx").on(table.googleId),
  verificationTokenIdx: index("users_verification_token_idx").on(table.verificationToken),
  resetTokenIdx: index("users_reset_token_idx").on(table.resetToken),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserPreferences = NonNullable<User["preferences"]>;
