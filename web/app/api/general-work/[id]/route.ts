import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generalWork, clients, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/authorize";
import { requireResourcePermission } from "@/lib/rbac";
import { Permissions } from "@/lib/auth/permissions";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermission(request, Permissions.GENERAL_WORK_VIEW);
        const { id } = await params;

        const canView = await requireResourcePermission(user.userId, user.firmId, "general_work", id, "view");
        if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const [work] = await db
            .select({
                id: generalWork.id,
                workNumber: generalWork.workNumber,
                title: generalWork.title,
                description: generalWork.description,
                workType: generalWork.workType,
                status: generalWork.status,
                priority: generalWork.priority,
                fee: generalWork.fee,
                paid: generalWork.paid,
                paymentStatus: generalWork.paymentStatus,
                startDate: generalWork.startDate,
                completionDate: generalWork.completionDate,
                dueDate: generalWork.dueDate,
                assignedTo: generalWork.assignedTo,
                assignedToName: users.name,
                createdBy: generalWork.createdBy,
                createdAt: generalWork.createdAt,
                updatedAt: generalWork.updatedAt,
                clientId: generalWork.clientId,
                firmId: generalWork.firmId,
                clientName: clients.name,
                clientNumber: clients.clientNumber,
            })
            .from(generalWork)
            .leftJoin(clients, eq(generalWork.clientId, clients.id))
            .leftJoin(users, eq(generalWork.assignedTo, users.id))
            .where(and(eq(generalWork.id, id), eq(generalWork.firmId, user.firmId)))
            .limit(1);

        if (!work) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        return NextResponse.json(work);
    } catch (error) {
        console.error("Error fetching general work:", error);
        return NextResponse.json(
            { error: "Failed to fetch general work" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermission(request, Permissions.GENERAL_WORK_EDIT);
        const { id } = await params;

        const canEdit = await requireResourcePermission(user.userId, user.firmId, "general_work", id, "edit");
        if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();

        // Check if work exists and belongs to the firm
        const [existingWork] = await db
            .select()
            .from(generalWork)
            .where(and(eq(generalWork.id, id), eq(generalWork.firmId, user.firmId)))
            .limit(1);

        if (!existingWork) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        // Update only provided fields
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.workType !== undefined) updateData.workType = body.workType;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.fee !== undefined) updateData.fee = body.fee ? Math.round(body.fee * 1000) : null;
        if (body.paid !== undefined) updateData.paid = body.paid ? Math.round(body.paid * 1000) : 0;
        if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
        if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.completionDate !== undefined) updateData.completionDate = body.completionDate ? new Date(body.completionDate) : null;
        if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
        if (body.clientId !== undefined) updateData.clientId = body.clientId;

        const [result] = await db
            .update(generalWork)
            .set(updateData)
            .where(eq(generalWork.id, id))
            .returning();

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating general work:", error);
        return NextResponse.json(
            { error: "Failed to update general work" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermission(request, Permissions.GENERAL_WORK_DELETE);
        const { id } = await params;

        const canDelete = await requireResourcePermission(user.userId, user.firmId, "general_work", id, "delete");
        if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Check if work exists and belongs to the firm
        const [existingWork] = await db
            .select()
            .from(generalWork)
            .where(and(eq(generalWork.id, id), eq(generalWork.firmId, user.firmId)))
            .limit(1);

        if (!existingWork) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        await db.delete(generalWork).where(eq(generalWork.id, id));

        return NextResponse.json({ success: true, message: "Work deleted successfully" });
    } catch (error) {
        console.error("Error deleting general work:", error);
        return NextResponse.json(
            { error: "Failed to delete general work" },
            { status: 500 }
        );
    }
}
