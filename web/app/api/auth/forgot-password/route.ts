import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { forgotPasswordSchema, generateResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, "auth:forgot", 5, 600);
    if (!rl.allowed) {
      return NextResponse.json({ message: "تم تجاوز الحد. حاول لاحقاً" }, { status: 429 });
    }
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة تعيين كلمة المرور" },
        { status: 200 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { message: "يرجى التحقق من بريدك الإلكتروني أولاً" },
        { status: 403 }
      );
    }

    // Generate reset token
    const { token: resetToken, expiresAt: resetTokenExpiresAt } =
      generateResetToken();

    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiresAt,
      })
      .where(eq(users.id, user.id));

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json(
      { message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "البريد الإلكتروني غير صحيح" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
