import { getTranslations } from "next-intl/server";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import { getLangDir } from "rtl-detect";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { firmUsers, roles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { Permissions } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function FirmCalendarPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "calendar" });
    const isRTL = getLangDir(locale) === "rtl";
    const session = await getSession();

    if (!session?.userId || !session?.firmId) {
        redirect(`/${locale}/login`);
    }

    // Server-Side Permission Check
    const [membership] = await db
        .select({ roleId: firmUsers.roleId })
        .from(firmUsers)
        .where(and(eq(firmUsers.userId, session.userId), eq(firmUsers.firmId, session.firmId)))
        .limit(1);

    let hasViewPermission = false;
    let hasManagePermission = false;
    if (membership && membership.roleId) {
        const [userRole] = await db
            .select({ permissions: roles.permissions })
            .from(roles)
            .where(eq(roles.id, membership.roleId))
            .limit(1);

        const perms = (userRole?.permissions as string[]) || [];
        if (perms.includes(Permissions.CALENDAR_VIEW_FIRM)) {
            hasViewPermission = true;
        }
        if (perms.includes(Permissions.CALENDAR_MANAGE_FIRM)) {
            hasManagePermission = true;
        }
    }

    if (!hasViewPermission) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h1 className="text-2xl font-bold text-red-500 mb-2">{t("accessDenied")}</h1>
                <p className="text-gray-600">{t("noFirmCalendarPermission")}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] gap-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("firmCalendar")}</h1>
                    <p className="text-gray-500">{t("firmCalendarDesc")}</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <CalendarComponent
                    eventsSource="/api/calendar/events?scope=firm"
                    isRTL={isRTL}
                    canEdit={hasManagePermission}
                />
            </div>
        </div>
    );
}
