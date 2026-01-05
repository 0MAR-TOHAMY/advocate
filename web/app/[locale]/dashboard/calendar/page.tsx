import { getTranslations } from "next-intl/server";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import { getLangDir } from "rtl-detect";

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function PersonalCalendarPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "calendar" });
    const isRTL = getLangDir(locale) === "rtl";

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] gap-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("myCalendar")}</h1>
                    <p className="text-gray-500">{t("myCalendarDesc")}</p>
                </div>
                {/* Add Event Button Could Go Here */}
            </div>

            <div className="flex-1 overflow-hidden">
                <CalendarComponent
                    eventsSource="/api/calendar/events?scope=personal"
                    isRTL={isRTL}
                    canEdit={true} // Users can edit their own calendar
                />
            </div>
        </div>
    );
}
