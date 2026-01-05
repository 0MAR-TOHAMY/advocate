/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest | Request): string {
  const headers = (req as any).headers as Headers;
  const xfwd = headers.get("x-forwarded-for") || headers.get("x-forwarded-for")?.toString();
  if (xfwd) {
    const first = xfwd.split(",")[0].trim();
    if (first) return first;
  }
  const xreal = headers.get("x-real-ip");
  if (xreal) return xreal;
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  return "unknown";
}
