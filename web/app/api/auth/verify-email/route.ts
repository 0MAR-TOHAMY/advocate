import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, "auth:verify", 20, 300);
    if (!rl.allowed) {
      return NextResponse.json({ message: "تم تجاوز الحد. حاول لاحقاً" }, { status: 429 });
    }
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "الرمز مطلوب" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          gt(users.verificationExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { message: "رمز التحقق غير صالح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "تم التحقق من البريد الإلكتروني مسبقاً" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        verificationExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    await sendWelcomeEmail(user.email, user.name);

    return NextResponse.json(
      {
        message: "تم التحقق من البريد الإلكتروني بنجاح",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء التحقق من البريد الإلكتروني" },
      { status: 500 }
    );
  }
}
