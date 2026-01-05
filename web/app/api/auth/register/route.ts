import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  registerSchema,
  hashPassword,
  generateVerificationToken,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, "auth:register", 5, 600);
    if (!rl.allowed) {
      return NextResponse.json({ message: "تم تجاوز الحد. حاول لاحقاً" }, { status: 429 });
    }
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مستخدم مسبقاً" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);

    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken();

    const [newUser] = await db
      .insert(users)
      .values({
        id: nanoid(),
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        phone: validatedData.phone,
        department: validatedData.department,
        position: validatedData.position,
        loginMethod: "local",
        isVerified: false,
        verificationToken,
        verificationExpiresAt,
        role: "user",
        isActive: true,
        preferences: {
          language: "ar",
          theme: "system",
          notifications: true,
          autoArchive: false,
        },
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    await sendVerificationEmail(newUser.email, newUser.name, verificationToken);

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "بيانات غير صحيحة", errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
