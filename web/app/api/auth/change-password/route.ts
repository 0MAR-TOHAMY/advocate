import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { changePasswordSchema, comparePassword, hashPassword, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { sendPasswordChangedEmail } from "@/lib/email";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "غير مصرح. يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    let payload: AccessTokenPayload;
    try {
      payload = verifyToken<AccessTokenPayload>(accessToken);
    } catch {
      return NextResponse.json(
        { message: "رمز غير صالح. يرجى تسجيل الدخول مرة أخرى" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "لا يمكن تغيير كلمة المرور لهذا الحساب" },
        { status: 400 }
      );
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    await sendPasswordChangedEmail(user.email, user.name);

    return NextResponse.json(
      { message: "تم تغيير كلمة المرور بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء تغيير كلمة المرور" },
      { status: 500 }
    );
  }
}
