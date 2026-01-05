import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  domain?: string;
  path?: string;
  maxAge?: number;
}

const cookieDomain =
  process.env.NODE_ENV === "production" ? process.env.AUTH_COOKIE_DOMAIN : undefined;

const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  path: "/",
};

export async function setAccessCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set({
    name: "access_token",
    value: token,
    ...defaultOptions,
    maxAge: 15 * 60, // 15 minutes
  });
}

export async function setRefreshCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set({
    name: "refresh_token",
    value: token,
    ...defaultOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get("access_token")?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get("refresh_token")?.value;
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set({
    name: "access_token",
    value: accessToken,
    ...defaultOptions,
    maxAge: 15 * 60, // 15 minutes
  });
  response.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    ...defaultOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const c = await cookies();
  try {
    c.delete("access_token");
  } catch { }
  try {
    c.delete("refresh_token");
  } catch { }
}
