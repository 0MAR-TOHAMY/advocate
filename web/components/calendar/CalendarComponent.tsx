"use client";

import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useLocale } from "next-intl";

import { useTranslations } from "next-intl";
import EventModal from "./EventModal";
import { useSearchParams } from "next/navigation";
import AlertModal from "@/components/ui/AlertModal";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/ui/Modal";
import { Eye, Edit, Calendar as CalendarIcon } from "lucide-react";

interface CalendarComponentProps {
    eventsSource: string; // API URL
    isRTL: boolean;
    canEdit: boolean;
}

export default function CalendarComponent({ eventsSource, isRTL, canEdit }: CalendarComponentProps) {
    const locale = useLocale();
    const t = useTranslations("calendar");
    const { authenticatedFetch, user } = useAuth();
    const calendarRef = React.useRef<FullCalendar>(null);
    const searchParams = useSearchParams();

    // Modal State
    const [menuConfig, setMenuConfig] = useState<{ x: number; y: number; isOpen: boolean } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"view" | "edit">("edit");
    const [selectedDate, setSelectedDate] = useState<{ start: Date; end: Date; allDay: boolean } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
    const [cases, setCases] = useState<{ id: string; title: string; caseNumber: string }[]>([]);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: "success" | "error" | "warning" | "info";
        message: string;
    }>({ isOpen: false, type: "info", message: "" });

    // Dynamic refetch when source changes
    useEffect(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    }, [eventsSource]);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = () => setMenuConfig(null);
        if (menuConfig?.isOpen) {
            window.addEventListener("click", handleClickOutside);
        }
        return () => window.removeEventListener("click", handleClickOutside);
    }, [menuConfig]);

    const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "error") => {
        setAlertConfig({ isOpen: true, type, message });
    };

    useEffect(() => {
        const fetchMembers = async () => {
            if (!user?.firmId) return;
            try {
                const res = await authenticatedFetch(`/api/firms/${user.firmId}/members`);
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data.members || []);
                }
            } catch (error) {
                console.error("Failed to fetch members:", error);
            }
        };
        fetchMembers();

        const fetchCases = async () => {
            try {
                const res = await authenticatedFetch(`/api/cases?pageSize=100`);
                if (res.ok) {
                    const data = await res.json();
                    setCases(data.items || []);
                }
            } catch (error) {
                console.error("Failed to fetch cases:", error);
            }
        };
        fetchCases();
    }, [user?.firmId, authenticatedFetch]);

    const handleEventClick = (info: EventClickArg) => {
        info.jsEvent.preventDefault();
        info.jsEvent.stopPropagation();

        setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            allDay: info.event.allDay,
            extendedProps: info.event.extendedProps,
            canEdit: info.event.extendedProps.canEdit
        });
        setSelectedDate(null);

        setMenuConfig({
            x: info.jsEvent.clientX,
            y: info.jsEvent.clientY,
            isOpen: true
        });
    };

    const handleDateSelect = (info: DateSelectArg) => {
        if (!canEdit) return;

        setSelectedEvent(null);
        setModalMode("edit");
        setSelectedDate({
            start: info.start,
            end: info.end,
            allDay: info.allDay
        });
        setIsModalOpen(true);
    };

    const handleEventChange = async (changeInfo: EventDropArg | EventResizeDoneArg) => {
        const { event } = changeInfo;
        const scope = eventsSource.includes("firm") ? "firm" : "personal";

        const res = await authenticatedFetch("/api/calendar/events", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: event.id,
                title: event.title,
                description: event.extendedProps.description,
                location: event.extendedProps.location,
                start: event.start?.toISOString(),
                end: event.end?.toISOString(),
                allDay: event.allDay,
                eventType: event.extendedProps.type,
                scope
            })
        });

        if (!res.ok) {
            changeInfo.revert();
            const errorMsg = res.status === 401 ? t("errors.unauthorized") : t("errors.saveFailed");
            showAlert(errorMsg, "error");
        }
    };

    const handleSaveEvent = async (eventData: any) => {
        // Extract scope from props source URL (hacky but effective for reuse)
        const scope = eventsSource.includes("firm") ? "firm" : "personal";
        const method = eventData.id ? "PUT" : "POST";

        const res = await authenticatedFetch("/api/calendar/events", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...eventData, scope })
        });

        if (res.ok) {
            setIsModalOpen(false);
            calendarRef.current?.getApi().refetchEvents();
        } else {
            const errorMsg = res.status === 401 ? t("errors.unauthorized") : t("errors.saveFailed");
            showAlert(errorMsg, "error");
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        const res = await authenticatedFetch(`/api/calendar/events?id=${eventId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            setIsModalOpen(false);
            calendarRef.current?.getApi().refetchEvents();
        } else {
            showAlert(t("errors.deleteFailed"), "error");
        }
    };

    return (
        <>
            <div className="bg-white p-4 rounded-[25px] border border-gray-100 h-full overflow-hidden">
                <style jsx global>{`
                    .fc {
                        font-size: 0.85rem; 
                         border-radius: 10px !important;
                    }
                    .fc-toolbar-title {
                        font-size: 1rem !important;
                        font-weight: 600;
                    }
                    .fc-event {
                        font-size: 0.75rem !important;
                        border-radius: 4px;
                        padding: 2px 4px;
                        border: none;
                    }
                    .fc-event-main {
                        color: #111827 !important;
                        font-weight: 600;
                    }
                    .fc-event-title, .fc-event-time {
                        color: #111827 !important;
                    }
                    .fc-col-header-cell-cushion {
                        font-weight: 600;
                        color: #64748b;
                        padding: 8px 0 !important;
                    }
                    .fc-daygrid-day-number {
                        font-weight: 500;
                        color: #475569;
                        font-size: 0.8rem;
                        padding: 4px 8px !important;
                    }
                    .fc-button {
                        font-size: 0.8rem !important;
                        font-weight: 500 !important;
                        text-transform: capitalize;
                    }
                    .fc-button-primary {
                        background-color: #1e293b !important;
                        border-color: #1e293b !important;
                    }
                    .fc-button-active {
                        background-color: #0f172a !important;
                        border-color: #0f172a !important;
                    }
                    .fc-day-today {
                        background-color: #f8fafc !important;
                    }
                    .fc-list-event-time {
                        font-size: 0.8rem;
                    }
                    .fc-list-event-title {
                        font-weight: 500;
                    }
                `}</style>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        start: isRTL ? "prev,next today" : "prev,next today",
                        center: "title",
                        end: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                    }}
                    buttonText={{
                        today: t("today"),
                        month: t("month"),
                        week: t("week"),
                        day: t("day"),
                        list: t("list")
                    }}
                    locale={locale} // 'ar' or 'en'
                    direction={isRTL ? "rtl" : "ltr"}
                    events={async (info, successCallback, failureCallback) => {
                        try {
                            const url = new URL(eventsSource, window.location.origin);
                            url.searchParams.set("start", info.start.toISOString());
                            url.searchParams.set("end", info.end.toISOString());

                            const res = await authenticatedFetch(url.toString());
                            if (!res.ok) throw new Error("Failed to fetch events");
                            const data = await res.json();
                            successCallback(data);
                        } catch (error) {
                            console.error("Calendar fetch error:", error);
                            failureCallback(error as any);
                        }
                    }}
                    editable={canEdit}
                    selectable={canEdit}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    eventDrop={handleEventChange}
                    eventResize={handleEventChange}
                    height="100%"
                    eventClassNames="cursor-pointer shadow-sm focus:outline-none"
                    // Customize event render to show proper colors based on type
                    eventDidMount={(info) => {
                        const type = info.event.extendedProps.type;
                        if (type === 'meeting') info.el.style.backgroundColor = '#dbeafe'; // Blue-100
                        else if (type === 'hearing') info.el.style.backgroundColor = '#fee2e2'; // Red-100
                        else if (type === 'deadline') info.el.style.backgroundColor = '#fef3c7'; // Amber-100
                        else if (type === 'consultation') info.el.style.backgroundColor = '#d1fae5'; // Green-100
                        else info.el.style.backgroundColor = '#f3f4f6'; // Gray-100

                        // Fix text color for contrast
                        info.el.style.setProperty('color', '#111827', 'important');
                    }}
                />
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialData={selectedEvent}
                selectedDate={selectedDate}
                isRTL={isRTL}
                readOnly={modalMode === "view"}
                members={members}
                cases={cases}
                scope={eventsSource.includes("scope=firm") ? "firm" : "personal"}
            />

            {/* Event Floating Action Menu */}
            {menuConfig?.isOpen && (
                <div
                    className="fixed z-[9999] w-fit bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200"
                    style={{
                        top: Math.min(menuConfig.y, window.innerHeight - 150),
                        left: isRTL ? undefined : Math.min(menuConfig.x, window.innerWidth - 200),
                        right: isRTL ? Math.min(window.innerWidth - menuConfig.x, window.innerWidth - 200) : undefined
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setModalMode("view");
                            setMenuConfig(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[12px]">{t("view")}</span>
                    </button>

                    {selectedEvent?.canEdit && (
                        <button
                            onClick={() => {
                                setModalMode("edit");
                                setMenuConfig(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Edit className="w-3 h-3 text-brand-primary" />
                            <span className="text-[12px]">{t("editEvent")}</span>
                        </button>
                    )}

                    {!selectedEvent?.canEdit && (
                        <div className="px-4 py-2 text-[12px] text-amber-600 bg-amber-50 mx-1.5 my-1 rounded-lg">
                            {t("errors.noEditPermission")}
                        </div>
                    )}
                </div>
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
}
