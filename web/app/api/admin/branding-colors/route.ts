import { NextResponse } from "next/server";
import { PRIMARY_COLORS, SECONDARY_COLORS } from "@/lib/config/branding";

export async function GET() {
    return NextResponse.json({
        primary: PRIMARY_COLORS,
        secondary: SECONDARY_COLORS,
    });
}