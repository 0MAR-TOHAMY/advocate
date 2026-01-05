import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { firmId } = await params;

        // Any member of the firm can list members for assignment
        const members = await db
            .select({
                id: users.id,
                name: users.name,
            })
            .from(firmUsers)
            .innerJoin(users, eq(firmUsers.userId, users.id))
            .where(and(
                eq(firmUsers.firmId, firmId),
                eq(firmUsers.status, "active")
            ));

        return NextResponse.json({ members }, { status: 200 });
    } catch (error) {
        console.error("Fetch members error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
