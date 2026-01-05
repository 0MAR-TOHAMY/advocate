import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generalWork, clients } from "@/lib/schema";
import { eq, and, or, like, desc, asc, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/auth/authorize";
import { getAccessibleResourceIds } from "@/lib/rbac";
import { Permissions } from "@/lib/auth/permissions";
import { requireActiveSubscription } from "@/lib/subscription/guard";

export async function GET(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.GENERAL_WORK_VIEW);

        // Granular Permission Check
        const access = await getAccessibleResourceIds(user.userId, user.firmId, "general_work");
        if (!access.all && access.ids.length === 0) {
            return NextResponse.json({ items: [], page: 1, pageSize: 10, total: 0 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const workType = searchParams.get("workType");
        const paymentStatus = searchParams.get("paymentStatus");

        // Collect filter conditions
        const conditions: any[] = [eq(generalWork.firmId, user.firmId)];

        // Apply granular filter
        if (!access.all && access.ids.length > 0) {
            conditions.push(inArray(generalWork.id, access.ids));
        }

        if (status && status !== "all") {
            conditions.push(eq(generalWork.status, status as any));
        }

        if (workType && workType !== "all") {
            conditions.push(eq(generalWork.workType, workType as any));
        }

        if (paymentStatus && paymentStatus !== "all") {
            conditions.push(eq(generalWork.paymentStatus, paymentStatus as any));
        }

        if (search) {
            conditions.push(
                or(
                    like(generalWork.workNumber, `%${search}%`),
                    like(generalWork.title, `%${search}%`)
                )!
            );
        }

        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
        const sort = searchParams.get("sort") || "createdAt";
        const order = (searchParams.get("order") || "desc").toLowerCase();

        // Get valid sort column
        const sortColumn = (generalWork as any)[sort] || generalWork.createdAt;
        const sorter = order === "asc" ? asc(sortColumn) : desc(sortColumn);

        // Count total
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(generalWork).where(and(...conditions)!);

        // Fetch items with client name
        const items = await db
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
                createdBy: generalWork.createdBy,
                createdAt: generalWork.createdAt,
                updatedAt: generalWork.updatedAt,
                clientId: generalWork.clientId,
                clientName: clients.name,
            })
            .from(generalWork)
            .leftJoin(clients, eq(generalWork.clientId, clients.id))
            .where(and(...conditions)!)
            .orderBy(sorter)
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        return NextResponse.json({ items, page, pageSize, total: count });
    } catch (error) {
        console.error("Error fetching general work:", error);
        return NextResponse.json(
            { error: "Failed to fetch general work" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.GENERAL_WORK_CREATE);

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const body = await request.json();

        // Generate work number if not provided
        const workNumber = body.workNumber || `WK-${Date.now().toString(36).toUpperCase()}`;

        const newWork = {
            id: nanoid(),
            firmId: user.firmId,
            createdBy: user.userId,
            workNumber,
            clientId: body.clientId,
            title: body.title,
            description: body.description || null,
            workType: body.workType,
            status: body.status || "pending",
            priority: body.priority || "medium",
            fee: body.fee ? Math.round(body.fee * 1000) : null, // Convert to fils
            paid: body.paid ? Math.round(body.paid * 1000) : 0,
            paymentStatus: body.paymentStatus || "unpaid",
            startDate: body.startDate ? new Date(body.startDate) : null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            completionDate: body.completionDate ? new Date(body.completionDate) : null,
            assignedTo: body.assignedTo || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [result] = await db.insert(generalWork).values(newWork).returning();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating general work:", error);
        return NextResponse.json(
            { error: "Failed to create general work" },
            { status: 500 }
        );
    }
}
