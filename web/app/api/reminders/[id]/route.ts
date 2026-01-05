import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, firmUsers, roles } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";

async function checkPermission(userId: string, firmId: string, requiredPerm: string) {
  const [membership] = await db
    .select({ roleId: (firmUsers.roleId as any) })
    .from(firmUsers as any)
    .where(and(eq(firmUsers.userId as any, userId as any), eq(firmUsers.firmId as any, firmId as any)))
    .limit(1);

  if (!membership || !membership.roleId) return false;

  const [userRole] = await db
    .select({ permissions: (roles.permissions as any) })
    .from(roles as any)
    .where(eq(roles.id as any, (membership.roleId as any)))
    .limit(1);

  const perms = (userRole?.permissions as string[]) || [];
  return perms.includes(requiredPerm);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId || !session.firmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId, firmId } = session;

    const { id } = await ctx.params;
    const [row] = await db.select().from(reminders as any).where(and(eq(reminders.id as any, id as any), eq(reminders.firmId as any, firmId as any))).limit(1);

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Strict Privacy & Permission Check
    const canManageFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_FIRM);
    const canViewFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_VIEW_FIRM);
    const canManageOwn = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_OWN);

    const isCreator = row.createdBy === userId;
    const isPersonal = row.scope === "personal";

    if (isPersonal) {
      // STRICT PRIVACY: Only creator can see their personal reminder.
      // Even Admin cannot see it unless they are the creator.
      if (!isCreator || !canManageOwn) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Firm Scope
      const assignees = row.assignedTo ? (typeof row.assignedTo === 'string' ? JSON.parse(row.assignedTo) : row.assignedTo) : [];
      const isAssignee = Array.isArray(assignees) ? assignees.includes(userId) : assignees === "all";

      if (!canManageFirm && !canViewFirm && !isAssignee) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ reminder: row });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reminder" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId || !session.firmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId, firmId } = session;

    const body = await req.json();
    const { id } = await ctx.params;

    const [existing] = await db.select().from(reminders as any).where(and(eq(reminders.id as any, id as any), eq(reminders.firmId as any, firmId as any))).limit(1);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canManageFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_FIRM);
    const canManageOwn = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_OWN);

    const isCreator = existing.createdBy === userId;
    const isPersonal = existing.scope === "personal";

    // Parse assignees safely
    let assignees: string[] | string = [];
    try {
      assignees = existing.assignedTo ? (typeof existing.assignedTo === 'string' ? JSON.parse(existing.assignedTo) : existing.assignedTo) : [];
    } catch (e) {
      assignees = existing.assignedTo || [];
    }
    const isAssignee = Array.isArray(assignees) ? assignees.includes(userId) : assignees === "all";

    const allowedFields = ["status", "snoozedUntil"];
    const updateKeys = Object.keys(body);
    const isStatusOnlyUpdate = updateKeys.every(k => allowedFields.includes(k));

    if (isPersonal) {
      // STRICT: Only creator can edit personal, if they have permission
      if (!isCreator || !canManageOwn) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Firm Scope
      if (!canManageFirm) {
        // If not manager, can only update status if assigned
        if (isAssignee && isStatusOnlyUpdate) {
          // Allowed
        } else {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const updateData: Partial<typeof reminders.$inferInsert> = { ...body };
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate as any);
    if (updateData.snoozedUntil) updateData.snoozedUntil = new Date(updateData.snoozedUntil as any);

    // Check if assignedTo is provided and handle it (jsonb expects JS object/array)
    if (updateData.assignedTo && typeof updateData.assignedTo === 'string') {
      try {
        updateData.assignedTo = JSON.parse(updateData.assignedTo);
      } catch (e) {
        // preserve as string if not JSON
      }
    }

    const [row] = await db.update(reminders as any).set({
      ...updateData,
      updatedAt: new Date()
    }).where(eq(reminders.id as any, id as any)).returning();

    return NextResponse.json({ reminder: row });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId || !session.firmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId, firmId } = session;

    const { id } = await ctx.params;
    const [existing] = await db.select().from(reminders as any).where(and(eq(reminders.id as any, id as any), eq(reminders.firmId as any, firmId as any))).limit(1);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canManageFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_FIRM);
    const canManageOwn = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_OWN);
    const isCreator = existing.createdBy === userId;
    const isPersonal = existing.scope === "personal";

    if (isPersonal) {
      if (!isCreator || !canManageOwn) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      if (!canManageFirm) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await db.delete(reminders as any).where(eq(reminders.id as any, id as any));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}
