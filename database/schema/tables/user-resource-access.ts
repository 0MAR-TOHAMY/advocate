import { index, pgTable, timestamp, uniqueIndex, varchar, text } from "drizzle-orm/pg-core";

/**
 * User Resource Access table
 * Defines granular permissions for users on specific resources (ABAC/ACL).
 * This enables rules like "User X can READ Case Y" or "User Z can WRITE Client A".
 */
export const userResourceAccess = pgTable("user_resource_access", {
    id: varchar("id", { length: 64 }).primaryKey(),
    firmId: varchar("firm_id", { length: 64 }).notNull(),
    userId: varchar("user_id", { length: 64 }).notNull(),

    // The type of resource being accessed: "case", "client", "document", "firm", "report"
    resourceType: varchar("resource_type", { length: 50 }).notNull(),

    // The specific ID of the resource
    resourceId: varchar("resource_id", { length: 64 }).notNull(),

    // The level of access: "view", "edit", "manage", "none"
    accessLevel: varchar("access_level", { length: 20 }).default("view").notNull(),

    // Metadata
    grantedBy: varchar("granted_by", { length: 64 }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (table) => ({
    firmIdx: index("ura_firm_idx").on(table.firmId),
    userIdx: index("ura_user_idx").on(table.userId),
    resourceIdx: index("ura_resource_idx").on(table.resourceType, table.resourceId),
    accessCheckIdx: index("ura_access_check_idx").on(table.userId, table.resourceType, table.resourceId),
    uniqueUserResource: uniqueIndex("ura_unique_user_resource").on(table.userId, table.resourceType, table.resourceId),
}));

export type UserResourceAccess = typeof userResourceAccess.$inferSelect;
export type InsertUserResourceAccess = typeof userResourceAccess.$inferInsert;
