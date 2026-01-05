import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, cases, firmUsers, roles } from "@/lib/schema";
import { eq, or, desc, and, sql, SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";

async function checkPermission(userId: string, firmId: string, requiredPerm: string) {
    const [membership] = await db
        .select({ roleId: firmUsers.roleId as any })
        .from(firmUsers as any)
        .where(and(eq(firmUsers.userId as any, userId as any), eq(firmUsers.firmId as any, firmId as any)))
        .limit(1);

    if (!membership || !membership.roleId) return false;

    const [userRole] = await db
        .select({ permissions: roles.permissions as any })
        .from(roles as any)
        .where(eq(roles.id as any, membership.roleId as any))
        .limit(1);

    const perms = (userRole?.permissions as string[]) || [];
    return perms.includes(requiredPerm);
}


export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const { userId, firmId } = session;

        const canManageFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_FIRM);
        const canViewFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_VIEW_FIRM);
        const canManageOwn = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_OWN);

        const includeAll = req.nextUrl.searchParams.get("include") === "all";

        // Start with base filter: Must be this firm
        const filters: SQL[] = [eq(reminders.firmId as any, firmId as any)];

        // OR conditions for visibility
        const visibilityConditions: SQL[] = [];

        // 1. Own Personal Reminders (Strict Privacy: Only if I have perm AND it's mine)
        if (canManageOwn) {
            visibilityConditions.push(and(
                eq(reminders.scope as any, "personal" as any),
                eq(reminders.createdBy as any, userId as any)
            ) as SQL);
        }

        // 2. Firm Reminders (If I have View or Manage Firm)
        if (canViewFirm || canManageFirm) {
            visibilityConditions.push(eq(reminders.scope as any, "firm" as any));
        } else {
            // Even if I don't have broad firm access, I should see firm reminders explicitly assigned to me
            visibilityConditions.push(and(
                eq(reminders.scope as any, "firm" as any),
                or(
                    sql`${reminders.assignedTo} @> ${JSON.stringify([userId])}::jsonb`,
                    sql`${reminders.assignedTo} = 'all'`
                )
            ) as SQL);
        }

        // Apply visibility
        if (visibilityConditions.length > 0) {
            filters.push(or(...visibilityConditions) as SQL);
        } else {
            // If no permissions at all, return nothing (force false)
            filters.push(sql`1 = 0`);
        }

        if (!includeAll) {
            filters.push(or(
                eq(reminders.status as any, "active" as any),
                eq(reminders.status as any, "snoozed" as any)
            ) as SQL);
        }

        const rows = await db.select({
            id: reminders.id as any,
            title: reminders.title as any,
            dueDate: reminders.dueDate as any,
            priority: reminders.priority as any,
            status: reminders.status as any,
            message: reminders.message as any,
            reminderType: reminders.reminderType as any,
            scope: reminders.scope as any,
            assignedTo: reminders.assignedTo as any,
            createdBy: reminders.createdBy as any,
            caseId: reminders.relatedEntityId as any,
            caseNumber: cases.caseNumber as any,
            caseYear: cases.caseYear as any,
            caseType: cases.caseType as any,
        }).from(reminders as any)
            .leftJoin(cases as any, and(
                eq(reminders.relatedEntityId as any, cases.id as any),
                eq(reminders.relatedEntityType as any, "case" as any)
            ))
            .where(and(...filters))
            .orderBy(desc(reminders.dueDate as any));

        return NextResponse.json({ reminders: rows });
    } catch (error) {
        console.error("Error fetching reminders:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const { userId, firmId } = session;
        const body = await req.json();

        const scope = body.scope || "personal";
        const assignees = body.assignedTo || null;

        // If trying to create a firm reminder, check for perms
        // Permission Checks
        if (scope === "firm") {
            const canManageFirm = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_FIRM);
            if (!canManageFirm) return NextResponse.json({ message: "Forbidden: Cannot create firm reminders" }, { status: 403 });
        } else {
            // Personal Scope
            const canManageOwn = await checkPermission(userId, firmId, Permissions.REMINDERS_MANAGE_OWN);
            if (!canManageOwn) return NextResponse.json({ message: "Forbidden: Cannot create personal reminders" }, { status: 403 });
        }

        const newReminder = {
            id: nanoid(),
            firmId,
            title: body.title,
            message: body.message ?? "",
            dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
            priority: body.priority || "medium",
            status: "active",
            reminderType: body.reminderType || "custom",
            scope,
            assignedTo: Array.isArray(assignees) ? assignees : (assignees === "all" ? "all" : null),
            relatedEntityType: body.relatedEntityType || null,
            relatedEntityId: body.relatedEntityId || null,
            createdBy: userId,
        } as typeof reminders.$inferInsert;

        const [row] = await db.insert(reminders as any).values(newReminder as any).returning();
        return NextResponse.json({ reminder: row }, { status: 201 });
    } catch (error) {
        console.error("Error creating reminder:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
