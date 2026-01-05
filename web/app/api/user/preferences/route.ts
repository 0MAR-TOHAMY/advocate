import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
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

    const { language, theme, notifications, autoArchive } = body;

    // Update user preferences
    await db
      .update(users)
      .set({
        preferences: {
          language,
          theme,
          notifications,
          autoArchive,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId));

    return NextResponse.json(
      { message: "تم تحديث التفضيلات بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update preferences error:", error);

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "رمز غير صالح" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "انتهت صلاحية الجلسة" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث التفضيلات" },
      { status: 500 }
    );
  }
}
