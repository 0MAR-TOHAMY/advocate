import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, firmUsers, roles, firms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAccessToken, verifyToken, AccessTokenPayload } from "@/lib/auth";

export async function GET() {
    try {
        const token = await getAccessToken();

        if (!token) {
            return NextResponse.json(
                { message: "غير مصرح" },
                { status: 401 }
            );
        }

        const payload = verifyToken<AccessTokenPayload>(token);

        const [userRow] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                avatarUrl: users.avatarUrl,
                coverUrl: users.coverUrl,
                department: users.department,
                position: users.position,
                firmId: users.firmId,
                firmName: users.firmName,
                firmNameAr: users.firmNameAr,
                role: users.role,
                preferences: users.preferences,
                createdAt: users.createdAt,
                lastLoginAt: users.lastLoginAt,
                lastSignedIn: users.lastSignedIn,
                isVerified: users.isVerified,
                googleId: users.googleId,
                loginMethod: users.loginMethod,
            } as any)
            .from(users as any)
            .where(eq(users.id as any, payload.userId))
            .limit(1);

        if (!userRow) {
            return NextResponse.json(
                { message: "المستخدم غير موجود" },
                { status: 404 }
            );
        }

        let firmId = userRow.firmId || "";
        let firmName = userRow.firmName;
        let firmNameAr = userRow.firmNameAr;
        let roleName = userRow.role as string;
        let primaryColor = "#1e40af";
        let secondaryColor = "#0f172a";

        let rolePermissions: string[] = [];

        const memberships: any[] = await db.select().from(firmUsers as any).where(eq(firmUsers.userId as any, userRow.id));
        if (memberships.length === 1 && memberships[0].status === "active") {
            firmId = memberships[0].firmId;
            if (memberships[0].roleId) {
                const [r]: any[] = await db.select().from(roles as any).where(eq(roles.id as any, memberships[0].roleId)).limit(1);
                if (r) {
                    roleName = r.name as string;
                    rolePermissions = (r.permissions as string[]) || [];
                }
            }
        }

        if (firmId) {
            const [firm]: any[] = await db
                .select({
                    primaryColor: firms.primaryColor,
                    secondaryColor: firms.secondaryColor,
                    firmName: firms.name,
                    firmNameAr: firms.nameAr,
                    storageUsedBytes: firms.storageUsedBytes,
                    maxStorageBytes: firms.maxStorageBytes,
                } as any)
                .from(firms as any)
                .where(eq(firms.id as any, firmId))
                .limit(1);

            if (firm) {
                primaryColor = firm.primaryColor || primaryColor;
                secondaryColor = firm.secondaryColor || secondaryColor;
                firmName = firm.firmName || firmName;
                firmNameAr = firm.firmNameAr || firmNameAr;
                (userRow as any).storageUsedBytes = firm.storageUsedBytes;
                (userRow as any).maxStorageBytes = firm.maxStorageBytes;
            }
        }

        const user = {
            ...userRow,
            firmId,
            firmName,
            firmNameAr,
            role: roleName,
            permissions: rolePermissions,
            primaryColor,
            secondaryColor,
            storageUsedBytes: (userRow as any).storageUsedBytes,
            maxStorageBytes: (userRow as any).maxStorageBytes,
        };
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Get user error:", error);

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
            { message: "حدث خطأ أثناء جلب بيانات المستخدم" },
            { status: 500 }
        );
    }
}
