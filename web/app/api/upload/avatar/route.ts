import { NextRequest, NextResponse } from "next/server";
import { uploadAvatar, deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
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

    // Get file data from request
    const body = await request.json();
    const { fileData } = body;

    if (!fileData) {
      return NextResponse.json(
        { error: "لم يتم تقديم ملف" },
        { status: 400 }
      );
    }

    // Validate file type (check base64 data URI)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileTypeMatch = fileData.match(/^data:(image\/[a-z]+);base64,/);
    if (!fileTypeMatch || !allowedTypes.includes(fileTypeMatch[1])) {
      return NextResponse.json(
        { error: "نوع الملف غير صالح. الصيغ المسموحة: JPG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    // Base64 encoding increases size by ~33%, so we check the base64 string length
    const base64Data = fileData.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى: 5MB" },
        { status: 400 }
      );
    }

    // Get current user to check for existing avatar
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      const publicId = user.avatarUrl.split("/").slice(-2).join("/").split(".")[0];
      await deleteFromCloudinary(publicId);
    }

    // Upload new avatar
    const result = await uploadAvatar(fileData, payload.userId);

    // Update user avatar URL in database
    await db
      .update(users)
      .set({
        avatarUrl: result.secureUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId));

    return NextResponse.json({
      message: "تم تحميل الصورة بنجاح",
      url: result.secureUrl,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "فشل تحميل الصورة" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.avatarUrl) {
      return NextResponse.json(
        { error: "لا توجد صورة لحذفها" },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    const publicId = user.avatarUrl.split("/").slice(-2).join("/").split(".")[0];
    await deleteFromCloudinary(publicId);

    // Update database
    await db
      .update(users)
      .set({
        avatarUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId));

    return NextResponse.json({
      message: "تم حذف الصورة بنجاح",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "فشل حذف الصورة" },
      { status: 500 }
    );
  }
}
