import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state") || "";

    const authUrl = getGoogleAuthUrl(state);
    
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error("Google OAuth URL error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء رابط تسجيل الدخول" },
      { status: 500 }
    );
  }
}
