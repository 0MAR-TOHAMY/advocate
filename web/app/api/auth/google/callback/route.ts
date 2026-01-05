import { NextRequest, NextResponse } from "next/server";
import { getGoogleUserInfo } from "@/lib/auth/google";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for errors from Google
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("فشل تسجيل الدخول بواسطة Google")}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("رمز التحقق مفقود")}`, request.url)
      );
    }

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(code);

    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("لم يتم الحصول على البريد الإلكتروني")}`, request.url)
      );
    }

    // Check if user exists (by email or googleId)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, googleUser.email),
          eq(users.googleId, googleUser.googleId)
        )
      )
      .limit(1);

    let userId: string;
    let firmId: string | null;

    if (existingUser) {
      // User exists - update Google ID if not set
      if (!existingUser.googleId) {
        // User registered with email, now linking Google account
        // Check if user has password (registered with email) to determine loginMethod
        const hasPassword = !!existingUser.passwordHash;

        await db
          .update(users)
          .set({
            googleId: googleUser.googleId,
            loginMethod: hasPassword ? "both" : "google", // "both" only if has password
            isVerified: true, // Google accounts are pre-verified
            // Don't update avatarUrl - keep user's existing avatar
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      } else {
        // Just update last login
        await db
          .update(users)
          .set({
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      }

      userId = existingUser.id;
      firmId = existingUser.firmId;
    } else {
      // Create new user
      const newUserId = nanoid();

      await db.insert(users).values({
        id: newUserId,
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        loginMethod: "google",
        isVerified: true, // Google accounts are pre-verified
        avatarUrl: googleUser.picture,
        firmId: null, // No firm assigned yet
        role: "user",
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userId = newUserId;
      firmId = null;
    }

    // Generate tokens
    const sessionId = nanoid();
    const accessToken = signAccessToken({
      userId,
      role: existingUser?.role || "user",
      firmId: firmId || "",
      firmName: existingUser?.firmName || null,
    });
    const refreshToken = signRefreshToken({
      userId,
      sessionId,
    });

    // Create response with redirect
    const redirectUrl = state || "/profile";
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Set auth cookies
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("حدث خطأ أثناء تسجيل الدخول")}`, request.url)
    );
  }
}
