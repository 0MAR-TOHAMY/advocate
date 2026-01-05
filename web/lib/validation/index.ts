/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { ErrorCodes } from '../errors/catalog';
import { Locale } from '../config/i18n.config';

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    // Handle JSON parse error or empty body
    throw new Error('Invalid JSON body');
  }
}

export function parseQuery<T>(req: NextRequest, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const params: Record<string, any> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.parse(params);
}

export function parseParams<T>(params: Record<string, string | string[]> | Promise<Record<string, string | string[]>>, schema: ZodSchema<T>): Promise<T> {
  // params in Next.js 15+ can be a promise
  return Promise.resolve(params).then(p => schema.parse(p));
}

export function handleZodError(error: ZodError, locale: Locale = 'en') {
  // In a real app, we would translate these messages based on locale
  // For now, we return the structured Zod issues
  const issues = error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    code: ErrorCodes.VALIDATION_ERROR,
    message: locale === 'ar' ? 'بيانات غير صالحة' : 'Validation Error',
    details: issues,
  };
}
