import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { resetPasswordSchema, hashPassword } from "@/lib/auth";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    await sendPasswordChangedEmail(user.email, user.name);

    return NextResponse.json(
      { message: "تم إعادة تعيين كلمة المرور بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء إعادة تعيين كلمة المرور" },
      { status: 500 }
    );
  }
}
