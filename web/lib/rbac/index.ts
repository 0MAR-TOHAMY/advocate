import { db } from "@/lib/db";
import { firms, firmUsers, roles } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { PermissionKey } from "./permissions";

export async function getMembership(userId: string, firmId: string) {
  const [m] = await db
    .select()
    .from(firmUsers as any)
    .where(and(eq((firmUsers as any).userId, userId), eq((firmUsers as any).firmId, firmId)))
    .limit(1) as any[];
  return m || null;
}

export async function isFirmAdmin(userId: string, firmId: string) {
  const [f] = await db.select().from(firms as any).where(eq((firms as any).id, firmId)).limit(1) as any[];
  if (f && f.adminId === userId) return true;
  const m = await getMembership(userId, firmId);
  if (!m) return false;
  if (!m.roleId) return false;
  const [r] = await db.select().from(roles as any).where(eq((roles as any).id, m.roleId)).limit(1) as any[];
  return !!r && r.name === "admin";
}

export async function requireAdmin(userId: string, firmId: string) {
  const ok = await isFirmAdmin(userId, firmId);
  return ok;
}

export async function getEffectivePermissions(userId: string, firmId: string): Promise<string[]> {
  const m = await getMembership(userId, firmId);
  if (!m) return [];
  let perms: string[] = [];
  if (m.roleId) {
    const [r] = await db.select().from(roles as any).where(eq((roles as any).id, m.roleId)).limit(1) as any[];
    if (r?.permissions && Array.isArray(r.permissions)) perms = [...perms, ...r.permissions as string[]];
  }
  if (m.customPermissions && Array.isArray(m.customPermissions)) perms = [...perms, ...m.customPermissions as string[]];
  const isAdmin = await isFirmAdmin(userId, firmId);
  if (isAdmin) {
    perms = Array.from(new Set([...perms, 'firm.view_dashboard', 'firm.manage_settings', 'firm.view_settings', 'firm.manage_users', 'firm.manage_roles', 'firm.manage_requests']));
  }
  return Array.from(new Set(perms));
}

export async function requirePermission(userId: string, firmId: string, key: PermissionKey) {
  const perms = await getEffectivePermissions(userId, firmId);
  return perms.includes(key);
}

export async function requireResourcePermission(
  userId: string,
  firmId: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<boolean> {
  const isAdmin = await isFirmAdmin(userId, firmId);
  if (isAdmin) return true;

  const m = await getMembership(userId, firmId);
  if (!m?.roleId) return false;

  const [r] = await db.select().from(roles as any).where(eq((roles as any).id, m.roleId)).limit(1) as any[];
  if (!r?.policy) return false;

  const policy = r.policy as { resources: { type: string, resourceId: string, actions: string[] }[] };

  // 1. Check for exact resource match
  const directRule = policy.resources.find(p => p.type === resourceType && p.resourceId === resourceId);
  if (directRule) {
    if (directRule.actions.includes(action) || directRule.actions.includes("*")) return true;
  }

  // 2. Check for "All" wildcard (resourceId = "*") for this type
  const allRule = policy.resources.find(p => p.type === resourceType && p.resourceId === "*");
  if (allRule) {
    if (allRule.actions.includes(action) || allRule.actions.includes("*")) return true;
  }

  return false;
}

export async function getAccessibleResourceIds(
  userId: string,
  firmId: string,
  resourceType: string
): Promise<{ all: boolean; ids: string[] }> {
  const isAdmin = await isFirmAdmin(userId, firmId);
  if (isAdmin) return { all: true, ids: [] };

  const m = await getMembership(userId, firmId);
  if (!m?.roleId) return { all: false, ids: [] };

  const [r] = await db.select().from(roles as any).where(eq((roles as any).id, m.roleId)).limit(1) as any[];
  if (!r?.policy) return { all: false, ids: [] };

  const policy = r.policy as { resources: { type: string, resourceId: string, actions: string[] }[] };

  // Check for wildcard access
  const wildcards = policy.resources.filter(p => p.type === resourceType && p.resourceId === "*");
  // We assume if they have a wildcard rule with ANY action (usually view is the base), they can see the list.
  // Ideally we check for specific 'view' action on the wildcard, but simply having a rule usually implies list visibility.
  // Let's be strict: must have 'view' or '*' action.
  if (wildcards.some(w => w.actions.includes("view") || w.actions.includes("*"))) {
    return { all: true, ids: [] };
  }

  // Collect specific IDs
  const ids = policy.resources
    .filter(p => p.type === resourceType && p.resourceId !== "*" && (p.actions.includes("view") || p.actions.includes("*")))
    .map(p => p.resourceId);

  return { all: false, ids };
}