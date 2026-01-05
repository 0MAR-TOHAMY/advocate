import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, firmUsers, firms } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PermissionKeys } from "@/lib/rbac/permissions";
import { nanoid } from "nanoid";
import { sendInvitationEmail } from "@/lib/email/service";
import { requireActiveSubscription, hasUserSeats } from "@/lib/subscription/guard";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ firmId: string }> }
) {
    try {
        const token = await getAccessToken();
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
        const payload = verifyToken<AccessTokenPayload>(token);
        const { firmId } = await params;

        const ok = await requirePermission(payload.userId, firmId, PermissionKeys.FirmManageUsers);
        if (!ok) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });

        // Check subscription and seat limits
        const { allowed, errorResponse } = await requireActiveSubscription();
        if (!allowed) return errorResponse;

        const canAdd = await hasUserSeats(firmId);
        if (!canAdd) {
            // Send seat limit reached notification/email to admin
            try {
                const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
                if (firm) {
                    const { sendSeatLimitReachedEmail } = await import("@/lib/email/service");
                    const { createFirmNotification } = await import("@/lib/notifications/service");
                    const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/subscription`;

                    // We notify the admin who is trying to do the action
                    const [admin] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
                    if (admin) {
                        await sendSeatLimitReachedEmail(admin.email, admin.name || "Admin", firm.name, firm.currentUsers || 0, firm.maxUsers || 0, billingUrl);
                        await createFirmNotification({
                            firmId,
                            type: "member",
                            title: "Seat Limit Reached",
                            message: `You have reached the maximum number of users for your current plan (${firm.currentUsers}/${firm.maxUsers}).`,
                            severity: "warning",
                            linkUrl: "/dashboard/subscription"
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to send seat limit notifications:", e);
            }

            return NextResponse.json({ message: "تم بلوغ الحد الأقصى للمستخدمين" }, { status: 409 });
        }

        const { email, roleId } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "Email required" }, { status: 400 });
        }

        const [firm] = await db.select().from(firms).where(eq(firms.id, firmId)).limit(1);
        if (!firm) return NextResponse.json({ message: "Firm not found" }, { status: 404 });

        // Check if user exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser) {
            // Check if already in firm
            const [existingMember] = await db.select()
                .from(firmUsers)
                .where(and(eq(firmUsers.firmId, firmId), eq(firmUsers.userId, existingUser.id)))
                .limit(1);

            if (existingMember) {
                return NextResponse.json({ message: "User is already a member" }, { status: 400 });
            }

            // Auto-add to firm
            await db.insert(firmUsers).values({
                id: nanoid(),
                firmId,
                userId: existingUser.id,
                roleId: roleId || null,
                status: "active",
                joinedAt: new Date(),
            });

            // Update user's firmId if they don't have one (optional, but good for "primary" firm)
            if (!existingUser.firmId) {
                await db.update(users).set({ firmId }).where(eq(users.id, existingUser.id));
            }

            // Send "You have been added" email (using invitation template for now, slightly modified context)
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
            await sendInvitationEmail(email, firm.name, inviteLink);
        } else {
            // User doesn't exist, send invitation link
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/firms/join?tag=${firm.tag || firmId}`;
            await sendInvitationEmail(email, firm.name, inviteLink);
        }

        return NextResponse.json({ message: "Invitation sent" }, { status: 200 });

    } catch (error) {
        console.error("Invitation error:", error);
        return NextResponse.json({ message: "Failed to send invitation" }, { status: 500 });
    }
}
