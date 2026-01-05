import { pgTable, varchar, timestamp, index, primaryKey } from "drizzle-orm/pg-core";

export const rolePermissions = pgTable("role_permissions", {
  roleId: varchar("role_id", { length: 64 }).notNull(),
  permissionId: varchar("permission_id", { length: 64 }).notNull(), // using ID, but prompt says "permissionKey" sometimes. Let's use ID to link to permissions table.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  roleIdx: index("role_permissions_role_idx").on(table.roleId),
  permissionIdx: index("role_permissions_permission_idx").on(table.permissionId),
}));

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
