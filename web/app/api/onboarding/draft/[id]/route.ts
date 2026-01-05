import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmDrafts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const draftId = id;

        const [draft] = await db
            .select()
            .from(firmDrafts)
            .where(
                and(
                    eq(firmDrafts.id, draftId),
                    eq(firmDrafts.ownerId, session.userId)
                )
            )
            .limit(1);

        if (!draft) {
            return NextResponse.json({ message: "Draft not found" }, { status: 404 });
        }

        return NextResponse.json({ draft }, { status: 200 });
    } catch (error) {
        console.error("Get draft error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
