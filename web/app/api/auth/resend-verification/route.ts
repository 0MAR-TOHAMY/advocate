import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, "auth:resend", 5, 600);
    if (!rl.allowed) {
      return NextResponse.json({ message: "تم تجاوز الحد. حاول لاحقاً" }, { status: 429 });
    }
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط التحقق" },
        { status: 200 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "تم التحقق من البريد الإلكتروني مسبقاً" },
        { status: 400 }
      );
    }

    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken();

    await db
      .update(users)
      .set({
        verificationToken,
        verificationExpiresAt,
      })
      .where(eq(users.id, user.id));

    await sendVerificationEmail(user.email, user.name, verificationToken);

    return NextResponse.json(
      { message: "تم إرسال رابط التحقق إلى بريدك الإلكتروني" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء إرسال رابط التحقق" },
      { status: 500 }
    );
  }
}
