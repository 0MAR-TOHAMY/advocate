/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseExpenses, cases, clients } from "@/lib/schema";
import { eq, desc, asc, getTableColumns, and, or, like, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get("caseId");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const query = db
      .select({
        ...getTableColumns(caseExpenses),
        caseTitle: cases.title,
        clientName: clients.name,
      })
      .from(caseExpenses)
      .leftJoin(cases, eq(caseExpenses.caseId, cases.id))
      .leftJoin(clients, eq(cases.clientId, clients.id));

    const conditions: any[] = [];
    if (caseId) {
      conditions.push(eq(caseExpenses.caseId, caseId));
    }
    if (type && type !== "all") {
      conditions.push(eq(caseExpenses.expenseType, type as any));
    }
    if (category) {
      conditions.push(eq(caseExpenses.category, category));
    }
    if (search) {
      conditions.push(
        or(
          like(caseExpenses.description, `%${search}%`),
          like(cases.title, `%${search}%`),
          like(clients.name, `%${search}%`)
        )!
      );
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sort = searchParams.get("sort") || "expenseDate";
    const order = (searchParams.get("order") || "desc").toLowerCase();
    const sorter = order === "asc" ? asc((caseExpenses as any)[sort]) : desc((caseExpenses as any)[sort]);
    const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(caseExpenses)
      .where(conditions.length ? and(...conditions)! : (undefined as any));
    const items = await finalQuery.orderBy(sorter).limit(pageSize).offset((page - 1) * pageSize);

    return NextResponse.json({ items, page, pageSize, total: count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      expenseType,
      customExpenseType,
      amount,
      currency,
      description,
      expenseDate,
      attachmentUrl,
      category
    } = body;

    if (!caseId || !expenseType || !amount || !expenseDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newExpense = {
      id: nanoid(),
      firmId: "default-firm",
      caseId,
      expenseType,
      customExpenseType: customExpenseType || null,
      category: category || "expense",
      amount: String(amount),
      currency: currency || "AED",
      description: description || null,
      expenseDate: new Date(expenseDate),
      attachmentId: null,
      attachmentUrl: attachmentUrl || null,
      createdBy: "current-user",
    };

    const [result] = await db.insert(caseExpenses).values(newExpense as any).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
