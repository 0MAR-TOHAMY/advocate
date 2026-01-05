import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  getAccessToken,
  verifyToken,
  AccessTokenPayload,
  updateProfileSchema,
} from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const token = await getAccessToken();

    if (!token) {
      return NextResponse.json(
        { message: "غير مصرح" },
        { status: 401 }
      );
    }

    const payload = verifyToken<AccessTokenPayload>(token);
    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        coverUrl: users.coverUrl,
        department: users.department,
        position: users.position,
        firmName: users.firmName,
        preferences: users.preferences,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "فشل تحديث الملف الشخصي" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "تم تحديث الملف الشخصي بنجاح",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الملف الشخصي" },
      { status: 500 }
    );
  }
}
