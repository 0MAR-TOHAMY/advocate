import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { events, firmUsers, roles, firms, users, cases } from "@/lib/schema";
import { and, eq, gte, lte, or, sql, inArray } from "drizzle-orm";
import { Permissions } from "@/lib/auth/permissions";
import { nanoid } from "nanoid";
import { sendEventAssignedEmail } from "@/lib/email/service";

async function checkPermission(userId: string, firmId: string, requiredPerm: string) {
    const [membership] = await db
        .select({ roleId: firmUsers.roleId })
        .from(firmUsers)
        .where(and(eq(firmUsers.userId, userId), eq(firmUsers.firmId, firmId))!)
        .limit(1);

    if (!membership || !membership.roleId) return false;

    const [userRole] = await db
        .select({ permissions: roles.permissions })
        .from(roles)
        .where(eq(roles.id, membership.roleId))
        .limit(1);

    const perms = (userRole?.permissions as string[]) || [];
    return perms.includes(requiredPerm);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const scope = searchParams.get("scope") || "personal"; // personal | firm

        // 1. Auth Check
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { userId, firmId } = session;

        // 2. Strict Permission Check for Firm Scope
        let hasManageFirmPerm = false;
        if (scope === "firm") {
            const canView = await checkPermission(userId, firmId, Permissions.CALENDAR_VIEW_FIRM);
            if (!canView) return new Response("Forbidden: Insufficient Permissions", { status: 403 });

            hasManageFirmPerm = await checkPermission(userId, firmId, Permissions.CALENDAR_MANAGE_FIRM);
        }

        // 3. Date Filters
        const filters = [eq(events.firmId, firmId)];
        if (start) filters.push(gte(events.startTime, new Date(start)));
        if (end) filters.push(lte(events.startTime, new Date(end)));

        // 4. Scope Filters
        if (scope === "firm") {
            filters.push(eq(events.scope, "firm"));
        } else {
            // Personal scope: show personal events where user is creator, assignedTo, or in attendees list
            filters.push(eq(events.scope, "personal"));

            // We use SQL fragment to check if userId is in attendees JSON array or attendees is "all"
            const personalFilter = or(
                eq(events.assignedTo, userId),
                eq(events.createdBy, userId),
                sql`${events.attendees} = 'all'`,
                sql`${events.attendees} LIKE ${'%"' + userId + '"%'}`
            );
            if (personalFilter) filters.push(personalFilter);
        }

        // 5. Query
        const data = await db
            .select()
            .from(events)
            .where(and(...filters));

        // 6. Format for FullCalendar
        const formattedEvents = data.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startTime,
            end: event.endTime,
            allDay: event.allDay,
            extendedProps: {
                description: event.description,
                location: event.location,
                meetingLink: event.meetingLink,
                caseId: event.caseId,
                type: event.eventType,
                status: event.status,
                assignees: event.attendees ? JSON.parse(event.attendees) : [],
                // Edit Logic:
                // 1. If Firm Scope: User must have MANAGE_FIRM permission OR be the creator
                // 2. If Personal Scope: User is usually creator or assigned (can manage own)
                canEdit: scope === "firm" ? (hasManageFirmPerm || event.createdBy === userId) : true
            }
        }));

        return NextResponse.json(formattedEvents);

    } catch (error) {
        console.error("Calendar API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) {
            return new Response("Unauthorized", { status: 401 });
        }
        const { userId, firmId } = session;

        const body = await req.json();
        const { title, description, location, meetingLink, caseId, start, end, allDay, eventType, scope, assignees } = body;

        // Permission Check for Creating Firm Events
        if (scope === "firm") {
            const canManage = await checkPermission(userId, firmId, Permissions.CALENDAR_MANAGE_FIRM);
            if (!canManage) return new Response("Forbidden: Cannot Create Firm Events", { status: 403 });
        }

        // Fetch Firm Settings for Default Reminder
        const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
        const reminderDays = firm?.reminderAdvanceNoticeDays || 7;
        const reminderMinutes = reminderDays * 24 * 60;

        const newEventId = nanoid();
        await db.insert(events).values({
            id: newEventId,
            firmId,
            caseId,
            title,
            description,
            location,
            meetingLink,
            startTime: new Date(start),
            endTime: end ? new Date(end) : null,
            allDay: allDay || false,
            eventType: eventType || "other",
            scope: scope || "personal",
            attendees: assignees ? JSON.stringify(assignees) : null,
            createdBy: userId,
            assignedTo: Array.isArray(assignees) && assignees.length === 1 && assignees[0] !== "all" ? assignees[0] : userId,
            reminderMinutes,
            status: "scheduled"
        });

        // Send Notifications to Assignees
        if (assignees && Array.isArray(assignees)) {
            const assigneeIds = assignees.filter(id => id !== "all" && id !== userId);
            if (assigneeIds.length > 0) {
                const assignedUsers = await db.select().from(users).where(inArray(users.id, assigneeIds));
                for (const u of assignedUsers) {
                    if (u.email) {
                        await sendEventAssignedEmail(
                            u.email,
                            u.name || "Member",
                            title,
                            new Date(start).toLocaleString(),
                            firm?.name || "The Firm"
                        );
                    }
                }
            }
        }

        return NextResponse.json({ success: true, id: newEventId });

    } catch (error) {
        console.error("Calendar Create Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) return new Response("Unauthorized", { status: 401 });
        const { userId, firmId } = session;

        const body = await req.json();
        const { id, title, description, location, meetingLink, caseId, start, end, allDay, eventType, scope, assignees } = body;

        // Locate existing event to verify ownership
        const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.firmId, firmId))!).limit(1);
        if (!existing) return new Response("Event Not Found", { status: 404 });

        // Update Permission
        const isCreator = existing.createdBy === userId;
        const canManageFirm = await checkPermission(userId, firmId, Permissions.CALENDAR_MANAGE_FIRM);

        // If not creator, usually need admin/manage rights
        if (!isCreator && !canManageFirm) {
            return new Response("Forbidden to Edit this Event", { status: 403 });
        }

        const prevAssignees = existing.attendees ? JSON.parse(existing.attendees) : [];

        await db.update(events).set({
            title,
            description,
            location,
            meetingLink,
            caseId,
            startTime: new Date(start),
            endTime: end ? new Date(end) : null,
            allDay,
            eventType,
            scope: scope || existing.scope,
            attendees: assignees ? JSON.stringify(assignees) : existing.attendees,
            updatedAt: new Date()
        }).where(eq(events.id, id));

        // Notify NEW assignees
        if (assignees && Array.isArray(assignees)) {
            const newAssigneeIds = assignees.filter(id => id !== "all" && id !== userId && !prevAssignees.includes(id));
            if (newAssigneeIds.length > 0) {
                const assignedUsers = await db.select().from(users).where(inArray(users.id, newAssigneeIds));
                const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
                for (const u of assignedUsers) {
                    if (u.email) {
                        await sendEventAssignedEmail(
                            u.email,
                            u.name || "Member",
                            title,
                            new Date(start).toLocaleString(),
                            firm?.name || "The Firm"
                        );
                    }
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Calendar Update Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId || !session.firmId) return new Response("Unauthorized", { status: 401 });
        const { userId, firmId } = session;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new Response("Missing ID", { status: 400 });

        const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.firmId, firmId))!).limit(1);
        if (!existing) return new Response("Event Not Found", { status: 404 });

        const isCreator = existing.createdBy === userId;
        const canManageFirm = await checkPermission(userId, firmId, Permissions.CALENDAR_MANAGE_FIRM);

        if (!isCreator && !canManageFirm) {
            return new Response("Forbidden to Delete this Event", { status: 403 });
        }

        await db.delete(events).where(eq(events.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Calendar Delete Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
