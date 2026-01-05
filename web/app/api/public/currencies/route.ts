import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currencies } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/errors/respond';

// Public endpoint to get active currencies
export async function GET(req: NextRequest) {
  try {
    const activeCurrencies = await db.query.currencies.findMany({
      where: eq(currencies.isActive, true),
      orderBy: (currencies, { asc }) => [asc(currencies.code)],
    });

    return NextResponse.json(activeCurrencies);
  } catch (error) {
    return handleApiError(error, req);
  }
}
