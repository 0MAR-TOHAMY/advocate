import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";

export async function PATCH(request: NextRequest) {
  try {
    // Get access token from cookie
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // Verify token
    let payload: AccessTokenPayload;
    try {
      payload = verifyToken<AccessTokenPayload>(accessToken);
    } catch {
      return NextResponse.json(
        { error: "رمز غير صالح" },
        { status: 401 }
      );
    }

    // Get update data from request
    const body = await request.json();
    const { name, phone, department, position } = body;

    // Update user profile
    await db
      .update(users)
      .set({
        name: name || undefined,
        phone: phone || undefined,
        department: department || undefined,
        position: position || undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId));

    // Get updated user
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    return NextResponse.json({
      message: "تم تحديث الملف الشخصي بنجاح",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "فشل تحديث الملف الشخصي" },
      { status: 500 }
    );
  }
}
