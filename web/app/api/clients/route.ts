/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/auth/authorize";
import { requireActiveSubscription } from "@/lib/subscription/guard";

import { getAccessibleResourceIds } from "@/lib/rbac";
import { inArray } from "drizzle-orm";

import { Permissions } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.CLIENTS_VIEW);

        // Granular Permission Check
        const access = await getAccessibleResourceIds(user.userId, user.firmId, "client");
        if (!access.all && access.ids.length === 0) {
            return NextResponse.json({ items: [], page: 1, pageSize: 10, total: 0 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const clientType = searchParams.get("clientType");

        // Collect filter conditions
        const conditions: any[] = [eq(clients.firmId, user.firmId) as any];

        // Apply granular filter if needed
        if (!access.all && access.ids.length > 0) {
            conditions.push(inArray(clients.id, access.ids));
        }

        if (status && status !== "all") {
            conditions.push(eq(clients.status, status as any));
        }

        if (clientType && clientType !== "all") {
            conditions.push(eq(clients.clientType, clientType as any));
        }

        if (search) {
            conditions.push(
                or(
                    like(clients.clientNumber, `%${search}%`),
                    like(clients.name, `%${search}%`),
                    like(clients.email, `%${search}%`),
                    like(clients.phone, `%${search}%`)
                )!
            );
        }

        // Build the final query in a single expression
        const finalQuery = db.select().from(clients).where(and(...conditions));
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
        const sort = searchParams.get("sort") || "createdAt";
        const order = (searchParams.get("order") || "desc").toLowerCase();
        const sortColumn = (sort && sort in clients) ? (clients as any)[sort] : clients.createdAt;
        const sorter = order === "asc" ? asc(sortColumn) : desc(sortColumn);
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(and(...conditions)!);
        const items = await finalQuery.orderBy(sorter).limit(pageSize).offset((page - 1) * pageSize);

        return NextResponse.json({ items, page, pageSize, total: count });
    } catch (error) {
        console.error("Error fetching clients:", error);
        return NextResponse.json(
            { error: "Failed to fetch clients" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.CLIENTS_CREATE);

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const body = await request.json();

        const newClient = {
            id: nanoid(),
            firmId: user.firmId,
            createdBy: user.userId,
            clientNumber: body.clientNumber || `CL-${Date.now()}`,
            ...body,
        };

        const [result] = await db.insert(clients).values(newClient).returning();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating client:", error);
        return NextResponse.json(
            { error: "Failed to create client" },
            { status: 500 }
        );
    }
}
