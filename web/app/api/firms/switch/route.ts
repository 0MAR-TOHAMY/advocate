/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmUsers, roles, users, firms } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload, signAccessToken, setAccessCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const payload = verifyToken<AccessTokenPayload>(token);
    const body = await req.json();
    const { firmId } = body as { firmId: string };
    if (!firmId) {
      return NextResponse.json({ message: "firmId مطلوب" }, { status: 400 });
    }

    const [membership] = await db
      .select()
      .from(firmUsers)
      .where(and(eq(firmUsers.userId, payload.userId), eq(firmUsers.firmId, firmId)))
      .limit(1);

    if (!membership || membership.status !== "active") {
      return NextResponse.json({ message: "ليست لديك عضوية نشطة" }, { status: 403 });
    }

    let roleName = "user";
    if (membership.roleId) {
      const [role] = await db.select().from(roles).where(eq(roles.id, membership.roleId)).limit(1);
      if (role) roleName = role.name;
    } else {
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (user?.role) roleName = user.role;
    }

    const [firm] = await db.select({ name: firms.name }).from(firms).where(eq(firms.id, firmId)).limit(1);
    const firmName = firm?.name || null;

    await db.update(users).set({ firmId, firmName }).where(eq(users.id, payload.userId));

    const newAccess = signAccessToken({ userId: payload.userId, role: roleName, firmId, firmName });
    await setAccessCookie(newAccess);
    return NextResponse.json({ message: "تم تحديث الشركة النشطة" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}