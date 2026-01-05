import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);
    const rows = await db
      .select({
        id: firmUsers.id,
        firmId: firmUsers.firmId,
        status: firmUsers.status,
        joinedAt: firmUsers.joinedAt,
        roleId: firmUsers.roleId,
        name: firms.name,
        tag: firms.tag,
        subscriptionStatus: firms.subscriptionStatus,
      })
      .from(firmUsers)
      .leftJoin(firms, eq(firmUsers.firmId, firms.id))
      .where(eq(firmUsers.userId, payload.userId));
    return NextResponse.json({ memberships: rows }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
