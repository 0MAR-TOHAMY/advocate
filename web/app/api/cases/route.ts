/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, clients } from "@/lib/schema";
import { eq, and, or, like, desc, asc, sql, inArray, SQL, getTableColumns } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/auth/authorize";
import { parseBody, parseQuery } from "@/lib/validation";
import { createCaseSchema, caseQuerySchema } from "@/lib/validation/schemas/cases";
import { handleApiError } from "@/lib/errors/respond";
import { requireActiveSubscription } from "@/lib/subscription/guard";
import { getAccessibleResourceIds } from "@/lib/rbac";

import { Permissions } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.CASES_VIEW);

        // Granular Permission Check
        const access = await getAccessibleResourceIds(user.userId, user.firmId, "case");
        if (!access.all && access.ids.length === 0) {
            return NextResponse.json({ items: [], page: 1, pageSize: 10, total: 0 });
        }

        const queryParams = parseQuery(request, caseQuerySchema);
        const { status, search, page, pageSize, sort, order, clientId } = queryParams;
        const safePage = page ?? 1;
        const safePageSize = pageSize ?? 10;

        // Apply filters
        const conditions: SQL<unknown>[] = [eq(cases.firmId, user.firmId)];

        // Add clientId filter
        if (clientId) {
            conditions.push(eq(cases.clientId, clientId));
        }

        // Apply granular filter if needed
        if (!access.all && access.ids.length > 0) {
            conditions.push(inArray(cases.id, access.ids));
        }

        if (status && status !== "all") {
            conditions.push(eq(cases.status, status));
        }

        if (search) {
            conditions.push(
                or(
                    like(cases.caseNumber, `%${search}%`),
                    like(cases.title, `%${search}%`),
                    like(cases.clientName, `%${search}%`)
                )!
            );
        }

        const query = db.select().from(cases).where(and(...conditions));

        // Safe sort column check
        const caseColumns = getTableColumns(cases);
        const sortKey =
            sort && Object.prototype.hasOwnProperty.call(caseColumns, sort)
                ? (sort as keyof typeof caseColumns)
                : "createdAt";
        const sortColumn = caseColumns[sortKey] ?? cases.createdAt;
        const sorter = order === "asc" ? asc(sortColumn) : desc(sortColumn);

        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cases).where(and(...conditions));

        type CaseRow = typeof cases.$inferSelect;
        const rawItems: CaseRow[] = await query
            .orderBy(sorter)
            .limit(safePageSize)
            .offset((safePage - 1) * safePageSize);
        const items = rawItems.map(({ password, ...rest }) => ({
            ...rest,
            hasPassword: !!password,
        }));

        return NextResponse.json({ items, page: safePage, pageSize: safePageSize, total: count });
    } catch (error) {
        return handleApiError(error, request);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(request, Permissions.CASES_CREATE);

        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const body = await parseBody(request, createCaseSchema);

        // Extract special fields
        const {
            filingDate: rawFilingDate,
            linkedCaseId,
            syncCaseStage,
            additionalOpposingParties,
            password: rawPassword,
            clientId,
            caseType,
            ...restBody
        } = body;

        const safeCaseType = caseType ?? "civil";

        const [client] = await db
            .select({ name: clients.name })
            .from(clients)
            .where(and(eq(clients.id, clientId), eq(clients.firmId, user.firmId)))
            .limit(1);

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 400 });
        }

        // Convert date
        const filingDate = rawFilingDate ? new Date(rawFilingDate) : null;

        // Handle Password
        let passwordHash: string | null = null;
        if (rawPassword && rawPassword.trim() !== "") {
            passwordHash = await hashPassword(rawPassword);
        }

        const newCase: typeof cases.$inferInsert = {
            id: nanoid(),
            firmId: user.firmId,
            createdBy: user.userId,
            caseYear: body.caseYear || new Date().getFullYear(),
            ...restBody,
            clientId,
            clientName: client.name,
            caseType: safeCaseType,
            parentCaseId: linkedCaseId || null,
            additionalParties: additionalOpposingParties || null,
            filingDate,
            password: passwordHash
        };

        const [result] = await db.insert(cases).values(newCase).returning();

        const { password, ...rest } = result;
        return NextResponse.json({ ...rest, hasPassword: !!password }, { status: 201 });
    } catch (error) {
        return handleApiError(error, request);
    }
}
