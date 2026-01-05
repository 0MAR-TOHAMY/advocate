import { NextResponse } from "next/server";
import {
  getRefreshToken,
  verifyToken,
  clearAuthCookies,
  getRedis,
  redisKeys,
  RefreshTokenPayload,
} from "@/lib/auth";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        const payload = verifyToken<RefreshTokenPayload>(refreshToken);
        const redis = getRedis();

        if (redis) {
          await redis.del(redisKeys.refreshToken(payload.userId, payload.sessionId));
        }
      } catch (error) {
        console.error("Error verifying refresh token during logout:", error);
      }
    }

    await clearAuthCookies();

    return NextResponse.json(
      { message: "تم تسجيل الخروج بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء تسجيل الخروج" },
      { status: 500 }
    );
  }
}
