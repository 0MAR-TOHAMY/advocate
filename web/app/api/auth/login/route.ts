import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, firmUsers, roles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  loginSchema,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  getRedis,
  redisKeys,
} from "@/lib/auth";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, "auth:login", 10, 300);
    if (!rl.allowed) {
      return NextResponse.json({ message: "تم تجاوز الحد. حاول لاحقاً" }, { status: 429 });
    }
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "يرجى التحقق من بريدك الإلكتروني أولاً" },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "الحساب غير نشط. يرجى التواصل مع الدعم" },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "يرجى استخدام طريقة تسجيل الدخول الأصلية" },
        { status: 400 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
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
    const accessToken = signAccessToken({ userId: user.id, role: roleName, firmId, firmName: user.firmName });

    const sessionId = crypto.randomUUID();
    const refreshToken = signRefreshToken({
      userId: user.id,
      sessionId,
    });

    const redis = getRedis();
    if (redis) {
      const ttl = 7 * 24 * 60 * 60; // 7 days
      await redis.set(
        redisKeys.refreshToken(user.id, sessionId),
        refreshToken,
        "EX",
        ttl
      );
    }

    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, user.id));

    await setAccessCookie(accessToken);
    await setRefreshCookie(refreshToken);

    return NextResponse.json(
      {
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          firmId: user.firmId,
          firmName: user.firmName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
