import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, firmUsers, roles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  getRefreshToken,
  verifyToken,
  signAccessToken,
  signRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  getRedis,
  redisKeys,
  RefreshTokenPayload,
} from "@/lib/auth";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { message: "لا يوجد رمز تحديث" },
        { status: 401 }
      );
    }

    // Verify the token first
    let payload: RefreshTokenPayload;
    try {
      payload = verifyToken<RefreshTokenPayload>(refreshToken);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json(
        { message: "رمز غير صالح" },
        { status: 401 }
      );
    }

    const redis = getRedis();

    // If Redis is available, validate session
    if (redis) {
      const key = redisKeys.refreshToken(payload.userId, payload.sessionId);
      const storedToken = await redis.get(key);

      if (!storedToken || storedToken !== refreshToken) {
        console.warn("Session not found in Redis or mismatch");
        return NextResponse.json(
          { message: "جلسة غير صالحة" },
          { status: 401 }
        );
      }
    } else {
      // Fallback: If no Redis, just trust the token verification
      console.warn("Redis not available - using token-only validation");
    }

    const [user] = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive, firmId: users.firmId, firmName: users.firmName })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "الحساب غير نشط" },
        { status: 403 }
      );
    }

    const newSessionId = crypto.randomUUID();
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      sessionId: newSessionId,
    });

    // Store in Redis if available
    if (redis) {
      const oldKey = redisKeys.refreshToken(payload.userId, payload.sessionId);
      await redis.del(oldKey);
      const ttl = 7 * 24 * 60 * 60; // 7 days
      await redis.set(
        redisKeys.refreshToken(user.id, newSessionId),
        newRefreshToken,
        "EX",
        ttl
      );
    }

    let firmId = user.firmId || "";
    let roleName = user.role;
    const memberships = await db.select().from(firmUsers).where(eq(firmUsers.userId, user.id));
    if (memberships.length === 1 && memberships[0].status === "active") {
      firmId = memberships[0].firmId;
      if (memberships[0].roleId) {
        const [r] = await db.select().from(roles).where(eq(roles.id, memberships[0].roleId)).limit(1);
        if (r && (r.name === "user" || r.name === "admin")) roleName = r.name;
      }
    }
    const newAccessToken = signAccessToken({ userId: user.id, role: roleName, firmId, firmName: user.firmName || null });

    await setAccessCookie(newAccessToken);
    await setRefreshCookie(newRefreshToken);

    console.log("Token refresh successful for user:", user.id);

    return NextResponse.json(
      { message: "تم تحديث الجلسة بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Refresh token error:", error);

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "رمز غير صالح" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الجلسة" },
      { status: 500 }
    );
  }
}
