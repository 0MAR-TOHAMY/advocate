import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/config/i18n.config';
import { NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware({ locales, defaultLocale, localePrefix: 'always' });

function needsFirmContext(pathname: string) {
  const p = pathname.replace(/^\/(ar|en)/, '') || '/';
  if (p.startsWith('/firm')) {
    if (p.startsWith('/firm/new')) return false;
    return true;
  }
  if (p.startsWith('/firms')) {
    if (p.startsWith('/firms/join')) return false;
    return true;
  }
  return false;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), "=");
  try {
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(ar|en)/);
  const locale = localeMatch ? localeMatch[0] : `/${defaultLocale}`;
  const p = pathname.replace(/^\/(ar|en)/, '') || '/';

  // Legacy Settings Redirects
  if (p === '/dashboard/settings/firm' || p === '/dashboard/settings') {
    const url = req.nextUrl.clone();
    url.pathname = `${locale}/dashboard/firm/settings`;
    return NextResponse.redirect(url);
  }
  if (p === '/dashboard/settings/usage' || p === '/dashboard/settings/billing') {
    const url = req.nextUrl.clone();
    url.pathname = `${locale}/dashboard/subscription`;
    return NextResponse.redirect(url);
  }

  const res = intl(req);
  const access = req.cookies.get('access_token')?.value;

  if (needsFirmContext(req.nextUrl.pathname)) {
    if (!access) {
      const url = req.nextUrl.clone();
      url.pathname = `${locale}/select-mode`;
      return NextResponse.redirect(url);
    }
    const payload = decodeJwtPayload(access);
    const firmId = payload?.firmId;
    if (!firmId || typeof firmId !== "string") {
      const url = req.nextUrl.clone();
      url.pathname = `${locale}/select-mode`;
      return NextResponse.redirect(url);
    }
  }
  return res;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/.*|.*\\..*$).*)',
  ],
};
