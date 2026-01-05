/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode, ErrorCodes, HttpStatus } from './catalog';
import { locales, defaultLocale, Locale } from '../config/i18n.config';
import { ZodError } from 'zod';
import { handleZodError } from '../validation';

export function getLocale(req: NextRequest): Locale {
  // 1. Check query param ?locale=
  const queryLocale = req.nextUrl.searchParams.get('locale');
  if (queryLocale && locales.includes(queryLocale as any)) {
    return queryLocale as Locale;
  }

  // 2. Check Cookie
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale as Locale;
  }

  // 3. Check Accept-Language header
  const acceptLanguage = req.headers.get('Accept-Language');
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]; // simple check
    if (locales.includes(preferred as any)) {
      return preferred as Locale;
    }
  }

  // 4. Fallback
  return defaultLocale;
}

export async function errorResponse(
  req: NextRequest,
  code: ErrorCode,
  status?: number,
  meta?: any
) {
  const locale = getLocale(req);
  const statusCode = status || HttpStatus[code] || 500;
  
  // TODO: Get translated message from i18n
  // For now, we will just use the code or a simple map
  // In a full implementation, we would use `getTranslations` from next-intl/server or a custom loader
  
  let message = code;
  try {
     const messages = (await import(`../../messages/${locale}.json`)).default;
     message = messages.errors?.[code] || code;
  } catch (e) {
    // Fallback if message file not found
    console.warn(`Could not load messages for locale ${locale}`, e);
  }

  return NextResponse.json(
    {
      error: code,
      message,
      ...meta,
    },
    { status: statusCode }
  );
}

export async function handleApiError(error: unknown, req: NextRequest) {
  console.error('API Error:', error);
  const locale = getLocale(req);

  if (error instanceof ZodError) {
    const formatted = handleZodError(error, locale);
    return errorResponse(req, ErrorCodes.VALIDATION_ERROR, HttpStatus.VALIDATION_ERROR, {
      details: formatted.details,
      message: formatted.message
    });
  }

  if (error instanceof Error) {
    // Check if it's a known error type if we had custom error classes
    // For now, treat as internal error unless specified
    if ((error as any).code && ErrorCodes[(error as any).code as ErrorCode]) {
         return errorResponse(req, (error as any).code, (error as any).status, { message: error.message });
    }
  }

  return errorResponse(req, ErrorCodes.INTERNAL_ERROR, 500);
}
