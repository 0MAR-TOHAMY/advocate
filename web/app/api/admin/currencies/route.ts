import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currencies } from '@/lib/schema';
import { requirePermission } from '@/lib/auth/authorize';
import { parseBody } from '@/lib/validation';
import { createCurrencySchema } from '@/lib/validation/schemas/currencies';
import { handleApiError } from '@/lib/errors/respond';
import { nanoid } from 'nanoid';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, 'currencies:manage');
    
    const allCurrencies = await db.select().from(currencies).orderBy(desc(currencies.isActive));
    return NextResponse.json(allCurrencies);
  } catch (error) {
    return handleApiError(error, req);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, 'currencies:manage');
    
    const body = await parseBody(req, createCurrencySchema);
    
    const newCurrency = {
      id: nanoid(),
      ...body,
      exchangeRate: body.exchangeRate.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [result] = await db.insert(currencies).values(newCurrency).returning();
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error, req);
  }
}
