import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, joinRequests, users } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { nanoid } from "nanoid";
import { rateLimit } from "@/lib/rate-limit";
import { sendJoinRequestEmail } from "@/lib/email/service";
import { firmUsers } from "@/lib/schema";
import { and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<AccessTokenPayload>(token);

    const body = await req.json();
    const { tag, code } = body as { tag?: string; code?: string };
    if (!tag && !code) return NextResponse.json({ message: "الرمز أو الوسم مطلوب" }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user || !user.isVerified) return NextResponse.json({ message: "يرجى التحقق من البريد" }, { status: 403 });
    const allowed = await rateLimit(`join:${payload.userId}`, 300, 5);
    if (!allowed) return NextResponse.json({ message: "محاولات كثيرة" }, { status: 429 });

    const [firm] = await db
      .select()
      .from(firms)
      .where(or(eq(firms.tag, tag || ""), eq(firms.joinCode, code || "")))
      .limit(1);
    if (!firm) return NextResponse.json({ message: "شركة غير موجودة" }, { status: 404 });

    await db.insert(joinRequests).values({
      id: nanoid(),
      firmId: firm.id,
      userId: payload.userId,
      status: "pending",
    });

    // Notify firm admin (optional background task, but simple here)
    try {
      // Find firm owner/admin
      const [admin] = await db.select({
        email: users.email,
        name: users.name
      })
        .from(firmUsers)
        .innerJoin(users, eq(firmUsers.userId, users.id))
        .where(and(eq(firmUsers.firmId, firm.id), eq(firmUsers.roleId, "owner"))) // Assuming "owner" is the roleId for owners
        .limit(1);

      if (admin) {
        await sendJoinRequestEmail(admin.email, admin.name, user.name || "A user", firm.name);
      }
    } catch (e) {
      console.error("Failed to send join request notification", e);
    }

    return NextResponse.json({ message: "تم إرسال الطلب" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}