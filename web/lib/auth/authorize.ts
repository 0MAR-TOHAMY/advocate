/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { db } from '../db';
import { firmUsers, permissions, rolePermissions, roles, userResourceAccess, cases } from '../schema';
import { eq, and, or } from 'drizzle-orm';
import { verifyToken } from './jwt';
import { getRedis } from './redis';
import { ErrorCodes } from '../errors/catalog';

export interface AuthPayload {
  userId: string;
  firmId: string;
  role: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthPayload> {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    throw { code: ErrorCodes.UNAUTHORIZED, status: 401, message: 'Unauthorized' };
  }

  try {
    const payload = verifyToken<AuthPayload>(token);
    return payload;
  } catch (err) {
    throw { code: ErrorCodes.TOKEN_EXPIRED, status: 401, message: 'Token expired or invalid' };
  }
}

/**
 * Get all global permissions for a user (Role-based + Custom).
 */
export async function getUserPermissions(userId: string, firmId: string): Promise<string[]> {
  const redis = getRedis();
  const cacheKey = `permissions:${firmId}:${userId}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  // 1. Get user's role
  const userRole = await db.query.firmUsers.findFirst({
    where: and(eq(firmUsers.userId, userId), eq(firmUsers.firmId, firmId)),
    with: { role: true }
  });

  if (!userRole || !userRole.roleId) return [];

  let perms: string[] = [];

  // 2. Get role permissions
  const rolePerms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, userRole.roleId));

  perms = rolePerms.map(p => p.key);

  // Legacy/Details fallback
  if (perms.length === 0) {
    const roleData = await db.query.roles.findFirst({ where: eq(roles.id, userRole.roleId) });
    if (roleData?.permissions && Array.isArray(roleData.permissions)) {
      perms = roleData.permissions as string[];
    }
  }

  // 3. Custom user permissions
  if (userRole.customPermissions && Array.isArray(userRole.customPermissions)) {
    perms = [...perms, ...(userRole.customPermissions as string[])];
  }

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(perms), 'EX', 300);
  }

  return perms;
}

/**
 * Check if user has a specific granular permission on a resource.
 * Implements ABAC (Attribute-Based Access Control) and Hierarchical Logic.
 */
export async function checkResourceAccess(
  userId: string,
  firmId: string,
  resourceType: 'case' | 'client' | 'document' | 'firm' | 'report',
  resourceId: string,
  minLevel: 'view' | 'edit' | 'manage' = 'view'
): Promise<boolean> {
  // 1. Direct Access Check (user_resource_access table)
  const exactAccess = await db.query.userResourceAccess.findFirst({
    where: and(
      eq(userResourceAccess.userId, userId),
      eq(userResourceAccess.firmId, firmId),
      eq(userResourceAccess.resourceType, resourceType),
      eq(userResourceAccess.resourceId, resourceId)
    )
  });

  if (exactAccess) {
    if (exactAccess.accessLevel === 'none') return false; // Explicit Deny

    const levels = { view: 1, edit: 2, manage: 3 };
    if (levels[exactAccess.accessLevel as keyof typeof levels] >= levels[minLevel]) {
      return true;
    }
  }

  // 2. Hierarchical Logic (e.g. Access to Client -> Access to Case)
  if (resourceType === 'case') {
    // Fetch the case to get clientId
    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, resourceId),
      columns: { clientId: true }
    });

    if (caseData?.clientId) {
      // Check if user has access to this Client
      // Recursive call!
      const clientAccess = await checkResourceAccess(userId, firmId, 'client', caseData.clientId, minLevel);
      if (clientAccess) return true;
    }
  }

  // 3. Document Hierarchy (Access to Case -> Access to Document) -> Not implemented yet to save DB calls, can be added.

  return false;
}

/**
 * Enforce Global Permission (RBAC).
 */
export async function requirePermission(req: NextRequest, permissionKey: string) {
  const user = await requireAuth(req);
  const userRole = (user.role || "").toLowerCase();

  // Super Admin / Owner Bypass
  if (userRole === 'admin' || userRole === 'owner') return user;

  const perms = await getUserPermissions(user.userId, user.firmId);

  if (!perms.includes(permissionKey)) {
    // Fallback: Check if they have "Manage Everything" permission?
    if (perms.includes('*') || perms.includes('all')) return user; // Wildcard support

    throw { code: ErrorCodes.FORBIDDEN, status: 403, message: `Missing permission: ${permissionKey}` };
  }

  return user;
}

/**
 * Enforce Granular Resource Access (ABAC).
 * Falls back to Global Permission if Granular check fails? 
 * OR: Requires EITHER Global Permission (View All Cases) OR Granular Permission (View This Case).
 */
export async function requireResourceAccess(
  req: NextRequest,
  resourceType: 'case' | 'client' | 'document' | 'firm' | 'report',
  resourceId: string,
  level: 'view' | 'edit' | 'manage'
) {
  const user = await requireAuth(req);
  const userRole = (user.role || "").toLowerCase();
  if (userRole === 'admin' || userRole === 'owner') return user;

  // 1. Check Global Permissions first (Broad Access)
  // e.g. "cases:view_all" allows viewing ANY case
  const perms = await getUserPermissions(user.userId, user.firmId);
  const globalKeyMap = {
    'case': { view: 'cases:view', edit: 'cases:edit', manage: 'cases:delete' }, // Simplified
    'client': { view: 'clients:view', edit: 'clients:edit', manage: 'clients:delete' }
  };

  // If user has global "View All Cases" (we need to define this key, let's assume 'cases:view' means ALL for now, or we define 'cases:view_all')
  // For now, let's assume 'cases:view' is Broad. 
  // IF we want Strict-by-default, 'cases:view' might mean "Can view cases assigned to me".

  // Implementation Decision:
  // We check Granular First. If true, pass.
  // If false, we check if they have a "Global Override" like "View All".

  const hasGranular = await checkResourceAccess(user.userId, user.firmId, resourceType, resourceId, level);
  if (hasGranular) return user;

  // Check Broad Access
  // This logic depends on how we interpret the basic permissions.
  // We will assume "cases:view" means "Can view global cases" for backward compatibility,
  // BUT we really want "cases:view" to be granular.
  // Let's rely on the calling route to enforce specific logic.
  // This helper just checks Granular.

  // Throw error if granular check failed
  throw { code: ErrorCodes.FORBIDDEN, status: 403, message: `Access denied to ${resourceType}` };
}

export async function requireOwnership(req: NextRequest, options: {
  resourceTable: any;
  resourceId: string;
  firmIdField?: string;
}) {
  const user = await requireAuth(req);
  const { resourceTable, resourceId, firmIdField = 'firmId' } = options;

  const resource = await db.select().from(resourceTable).where(eq(resourceTable.id, resourceId)).limit(1);
  if (!resource || resource.length === 0) {
    throw { code: ErrorCodes.NOT_FOUND, status: 404, message: 'Resource not found' };
  }

  if (resource[0][firmIdField] !== user.firmId) {
    throw { code: ErrorCodes.FORBIDDEN, status: 403, message: 'Access denied' };
  }

  return { user, item: resource[0] };
}
