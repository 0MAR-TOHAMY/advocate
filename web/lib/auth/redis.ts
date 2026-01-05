import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const isProd = process.env.NODE_ENV === "production";
  const url = process.env.REDIS_URL;
  if (!url) {
    if (isProd) {
      throw new Error("REDIS_URL is required in production");
    }
    return null;
  }
  
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }
  
  return client;
}

export const redisKeys = {
  refreshToken: (userId: string, sessionId: string) => 
    `refresh:user:${userId}:session:${sessionId}`,
  userSessions: (userId: string) => 
    `sessions:user:${userId}`,
  verificationToken: (token: string) => 
    `verification:${token}`,
  resetToken: (token: string) => 
    `reset:${token}`,
};

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
