import { getRedis } from "@/lib/auth";

export async function rateLimit(key: string, windowSec: number, max: number) {
  const r = getRedis();
  if (!r) return true;
  const nowBucket = Math.floor(Date.now() / 1000 / windowSec);
  const k = `rl:${key}:${nowBucket}`;
  const cnt = await r.incr(k);
  if (cnt === 1) await r.expire(k, windowSec);
  return cnt <= max;
}