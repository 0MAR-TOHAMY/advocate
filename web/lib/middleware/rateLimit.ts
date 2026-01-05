import type { NextRequest } from "next/server";
import { getRedis } from "@/lib/auth/redis";
import { getClientIp } from "@/lib/utils/ip";

export async function rateLimit(
  req: NextRequest | Request,
  prefix: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const ip = getClientIp(req) || "unknown";
  const key = `rl:${prefix}:${ip}`;
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    const remaining = Math.max(0, limit - count);
    return { allowed: count <= limit, remaining };
  }
  const now = Date.now();
  type Bucket = { count: number; resetAt: number };
  const g = globalThis as unknown as { __rateLimiter?: Map<string, Bucket> };
  if (!g.__rateLimiter) g.__rateLimiter = new Map<string, Bucket>();
  const mem = g.__rateLimiter;
  const cur = mem.get(key);
  if (!cur || cur.resetAt <= now) {
    mem.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  cur.count += 1;
  mem.set(key, cur);
  return { allowed: cur.count <= limit, remaining: Math.max(0, limit - cur.count) };
}
