/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import { Briefcase, FolderOpen, CalendarDays, UserRoundPlus, Hash, Clock, FileText, CheckSquare, XCircle, Eye, Bell } from "lucide-react";
import { parseISO, addDays, addWeeks } from "date-fns";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ReminderEditModal from "@/components/reminders/ReminderEditModal";
import Modal from "@/components/ui/Modal";
import DateTimeInput from "@/components/ui/DateTimeInput";
import ModalButton from "@/components/ui/ModalButton";
import EventModal from "@/components/calendar/EventModal";
import { DeadlineAlertBanner } from "@/components/ui/DeadlineAlertBanner";
import CircularCountdown from "@/components/ui/CircularCountdown";
import { useNotifications } from "@/contexts/NotificationsContext";

export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const tc = useTranslations("calendar");
    const tr = useTranslations("reminders");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const [stats, setStats] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [reminders, setReminders] = useState<any[]>([]);
    const [clientStats, setClientStats] = useState<any>(null);
    const [closedCasesTotal, setClosedCasesTotal] = useState<number>(0);
    const [casesByYear, setCasesByYear] = useState<Record<number, number>>({});
    const [nowTick, setNowTick] = useState<number>(Date.now());
    const [loading, setLoading] = useState(true);
    const truncate = (s: string | null | undefined, n: number) => {
        const t = s || "";
        return t.length > n ? t.slice(0, n) + "…" : t;
    };
    const [snoozeOpen, setSnoozeOpen] = useState(false);
    const [snoozeId, setSnoozeId] = useState<string | null>(null);
    const [snoozeDate, setSnoozeDate] = useState("");
    const [viewId, setViewId] = useState<string | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [selectedEventData, setSelectedEventData] = useState<any>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const handleSnooze = async (date: string | number | Date) => {
        if (!snoozeId) return;
        try {
            await fetch(`/api/reminders/${snoozeId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "snoozed", snoozedUntil: new Date(date).toISOString() })
            });
            setSnoozeOpen(false);
            setSnoozeId(null);
            setSnoozeDate("");
            const res = await fetch("/api/reminders");
            const data = await res.json();
            setReminders(data.reminders || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, eventsRes, remindersRes] = await Promise.all([
                fetch("/api/dashboard/stats"),
                fetch("/api/events/upcoming"),
                fetch("/api/reminders"),
            ]);

            if (!statsRes.ok || !eventsRes.ok || !remindersRes.ok) {
                console.error("Failed to fetch some dashboard data");
            }

            const statsData = await statsRes.json();
            const eventsData = await eventsRes.json();
            const remindersData = await remindersRes.json();

            // Map consolidated API response to component state
            setStats({
                totalCases: statsData.cases?.total || 0,
                activeCases: statsData.cases?.active || 0,
                upcomingEventsCount: statsData.upcomingEventsCount || 0,
                casesByStage: statsData.cases?.byStage || [],
                // Preserve other sections if needed or extend state
            });

            if (statsData.clients) {
                setClientStats({
                    totalClients: statsData.clients.total || 0,
                    activeClients: statsData.clients.active || 0,
                    clientsByType: statsData.clients.byType || {}
                });
            } else {
                setClientStats({ totalClients: 0, activeClients: 0, clientsByType: {} });
            }

            setClosedCasesTotal(statsData.cases?.closed || 0);
            setCasesByYear(statsData.cases?.byYear || {});

            setEvents(eventsData.events || []);
            setReminders(remindersData.reminders || []);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived data for alerts
    const upcomingDeadlines = useMemo(() => {
        const deads = [
            ...events.filter(e => e.eventType === 'deadline').map(e => ({
                id: e.id,
                title: e.title,
                startTime: e.startTime,
                eventType: 'deadline',
                source: 'event',
                caseNumber: e.caseNumber,
                description: e.description
            })),
            ...reminders.filter(r => r.reminderType === 'deadline' || r.priority === 'urgent').map(r => ({
                id: r.id,
                title: r.title,
                startTime: r.dueDate,
                eventType: 'deadline',
                source: 'reminder',
                caseNumber: r.caseNumber,
                description: r.message
            }))
        ];
        return deads
            .filter(d => new Date(d.startTime).getTime() > Date.now())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [events, reminders]);

    // Urgent items for circular countdown (due within 48 hours)
    const urgentItems = useMemo(() => {
        const now = new Date();
        return upcomingDeadlines.filter(d => {
            const diff = new Date(d.startTime).getTime() - now.getTime();
            return diff > 0 && diff < 48 * 60 * 60 * 1000;
        }).slice(0, 3);
    }, [upcomingDeadlines]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader />
            </div>
        );
    }

    const bannerLabels = {
        days: locale === "ar" ? "أيام" : "days",
        renew: locale === "ar" ? "يرجى التجديد" : "Please renew.",
        renewImmediate: locale === "ar" ? "التجديد الفوري مطلوب" : "Immediate renewal required.",
        deadlineMessage: locale === "ar" ? "الموعد النهائي في" : "Deadline on"
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col mb-6 md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">{t("title") || "Dashboard"}</h1>
                    <p className="text-gray-500 text-[14px]">{t("subtitle") || "Welcome back to your legal practice overview."}</p>
                </div>
                <Link href={`/${locale}/dashboard/clients/new`}>
                    <Button className="px-6! py-2! text-[14px]!">
                        <UserRoundPlus className={`h-4 w-4 ${locale === "en" ? "mr-2" : "ml-2"}`} />
                        {t("addClient") || "Add Client"}
                    </Button>
                </Link>
            </div>

            {/* Alert Banner */}
            <DeadlineAlertBanner
                upcomingDeadlines={upcomingDeadlines.slice(0, 5)}
                locale={locale}
                labels={bannerLabels}
            />

            {/* Urgency Section - Circular Countdowns for very urgent items */}
            {urgentItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {urgentItems.map((item, i) => (
                        <div key={i} className="bg-gradient-to-br from-red-50 to-white border border-red-100 p-4 rounded-[15px] shadow-sm flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">{locale === "ar" ? "عاجل جداً" : "URGENT"}</p>
                                <p className="text-sm font-semibold text-gray-800 truncate" title={item.title}>{item.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(item.startTime).toLocaleDateString()}</p>
                            </div>
                            <CircularCountdown
                                targetDate={item.startTime}
                                size={80}
                                color="red"
                                label={locale === "ar" ? "يوم" : "left"}
                            />
                        </div>
                    ))}
                </div>
            )}


            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/${locale}/dashboard/notifications`}>
                    <div className="bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-sm font-medium uppercase tracking-wider">{t("notifications.title") || (locale === "ar" ? "التنبيهات" : "Notifications")}</p>
                                <p className={`text-4xl font-bold mt-2 ${unreadCount > 0 ? "text-red-500" : "text-slate-700"}`}>{unreadCount}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${unreadCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                                <Bell className={`h-6 w-6 ${unreadCount > 0 ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 text-sm font-medium uppercase tracking-wider">{t("totalCases") || "Total Cases"}</p>
                            <p className="text-4xl text-slate-700 font-bold mt-2">{stats?.totalCases || 0}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-secondary flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-slate-200" />
                        </div>
                    </div>
                </div>

                <div className="bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 text-sm font-medium uppercase tracking-wider">{t("activeCases") || "Active Cases"}</p>
                            <p className="text-4xl text-slate-700 font-bold mt-2">{stats?.activeCases || 0}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{t("upcomingEvents") || "Upcoming Events"}</p>
                            <p className="text-4xl text-slate-700 font-bold mt-2">{stats?.upcomingEventsCount || 0}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-primary flex items-center justify-center">
                            <CalendarDays className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 1: Upcoming Events and Reminders */}
            <div className="grid gap-4 lg:grid-cols-2">

                {/* Upcoming Events - Modern Design */}
                <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                    <div className="p-4 px-6 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-[14px] font-semibold text-gray-800">{t("upcomingEvents") || "Upcoming Events"}</h3>
                        <Link href={`/${locale}/dashboard/calendar`} className="text-xs text-brand-primary hover:underline">{locale === "ar" ? "عرض الكل" : "View All"}</Link>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3 h-[500px] overflow-y-auto custom-scrollbar">
                            {events.filter(e => e.eventType !== 'deadline' && new Date(e.startTime).getTime() > nowTick).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">{t("noEvents") || "No upcoming events."}</p>
                                </div>
                            ) : (
                                events.filter(e => e.eventType !== 'deadline' && new Date(e.startTime).getTime() > nowTick).map((event) => {
                                    const now = new Date(nowTick);
                                    const start = parseISO(event.startTime);
                                    const diff = start.getTime() - now.getTime();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                    const typeLabel = (event.eventType || "other").toLowerCase();
                                    let typeText = tc(typeLabel as any);
                                    if (!typeText || typeText === typeLabel) {
                                        typeText = locale === 'ar'
                                            ? (typeLabel === "meeting" ? "اجتماع" : typeLabel === "hearing" ? "جلسة" : typeLabel === "deadline" ? "موعد نهائي" : "أخرى")
                                            : (typeLabel === "meeting" ? "Meeting" : typeLabel === "hearing" ? "Hearing" : typeLabel === "deadline" ? "Deadline" : "Other");
                                    }

                                    const typeColors: any = {
                                        meeting: { bg: "bg-brand-primary/10", text: "text-brand-primary", border: "border-brand-primary/20", indicator: "bg-brand-primary" },
                                        hearing: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", indicator: "bg-purple-300" },
                                        deadline: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", indicator: "bg-orange-300" },
                                        consultation: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", indicator: "bg-emerald-300" },
                                        other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100", indicator: "bg-gray-300" }
                                    };

                                    const colors = typeColors[typeLabel] || typeColors.other;
                                    const fullDateStr = start.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                    const timeLeft = days > 0
                                        ? (locale === "ar" ? `${days} يوم متبقي` : `${days} days left`)
                                        : (hours > 0 ? (locale === "ar" ? `${hours} ساعة متبقية` : `${hours} hours left`) : (locale === "ar" ? "قريباً جداً" : "Very soon"));

                                    return (
                                        <div key={event.id} className="group relative p-4 rounded-[15px] border border-gray-100 bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-gray-200 transition-all overflow-hidden">
                                            <div className="flex gap-3 relative z-10">
                                                <div className={`w-1 rounded-full ${colors.indicator} shrink-0`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-semibold text-sm text-gray-800 truncate pr-2">{event.title}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium capitalize shrink-0`}>{typeText}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                        <Hash className="h-3 w-3 text-gray-400" />
                                                        <span>{locale === "en" ? "Case # " : "القضية # "}{event.caseNumber !== null ? event.caseNumber : (locale === "en" ? "no related case" : "لا يوجد قضية مرتبطة")}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <span className="font-medium text-gray-600">{fullDateStr}</span>
                                                        <div className="mx-1 h-1 w-1 rounded-full bg-gray-300"></div>
                                                        <span className="text-gray-400">{timeLeft}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Action Buttons */}
                                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                                                <div className="overflow-hidden">
                                                    <div className="mt-3 flex justify-end gap-2 pt-2 w-full">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await fetch(`/api/events/${event.id}`);
                                                                    if (!res.ok) {
                                                                        console.error(`Failed to fetch event details for ID: ${event.id}, Status: ${res.status}`);
                                                                        try {
                                                                            const errText = await res.text();
                                                                            console.error("Error response:", errText);
                                                                        } catch (e) { console.error("Could not read error text"); }
                                                                        return;
                                                                    }
                                                                    const data = await res.json();
                                                                    // Transform for EventModal
                                                                    const modalData = {
                                                                        id: data.id,
                                                                        title: data.title,
                                                                        start: data.startTime,
                                                                        end: data.endTime,
                                                                        allDay: data.allDay,
                                                                        extendedProps: {
                                                                            description: data.description,
                                                                            location: data.location,
                                                                            type: data.eventType || 'other',
                                                                            meetingLink: data.meetingLink,
                                                                            caseId: data.caseId,
                                                                            assignees: data.assignees?.map((a: any) => a.userId) || []
                                                                        }
                                                                    };
                                                                    setSelectedEventData(modalData);
                                                                    setEventModalOpen(true);
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-center gap-2 p-2 rounded-md ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity text-xs font-medium`}
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Reminders - New Design with Expansion */}
                <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                    <div className="p-4 px-6 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-[14px] font-semibold text-gray-800">{t("reminders") || "Reminders"}</h3>
                        <Link href={`/${locale}/dashboard/reminders`} className="text-xs text-brand-primary hover:underline">{locale === "ar" ? "عرض الكل" : "View All"}</Link>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3 h-[500px] overflow-y-auto custom-scrollbar">
                            {reminders.filter(r => r.reminderType !== 'deadline' && new Date(r.dueDate).getTime() > nowTick).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-center text-[14px]">{t("noReminders") || "No active reminders."}</p>
                                </div>
                            ) : (
                                reminders.filter(r => r.reminderType !== 'deadline' && new Date(r.dueDate).getTime() > nowTick).map((reminder) => {
                                    const due = parseISO(reminder.dueDate);
                                    const p = String(reminder.priority || "low").toLowerCase();

                                    const priorityColors: any = {
                                        urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
                                        high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
                                        medium: { bg: "bg-brand-primary/10", text: "text-brand-primary", border: "border-brand-primary/20" },
                                        low: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100" }
                                    };

                                    const colors = priorityColors[p] || priorityColors.medium;

                                    const rp = tr.raw("priorities") as Record<string, string> | undefined;
                                    let priText = rp && rp[p] ? rp[p] : undefined;
                                    if (!priText) {
                                        priText = locale === "ar"
                                            ? (p === "urgent" ? "عاجلة" : p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة')
                                            : (p === "urgent" ? "Urgent" : p.charAt(0).toUpperCase() + p.slice(1));
                                    }
                                    const fullDateStr = due.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

                                    return (
                                        <div key={reminder.id} className={`group relative p-4 rounded-[15px] border border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all overflow-hidden`}>
                                            <div className="flex gap-3 relative z-10">
                                                <div className={`w-1 rounded-full ${p === 'urgent' ? 'bg-red-400' : p === 'high' ? 'bg-orange-400' : p === 'medium' ? 'bg-brand-primary' : 'bg-gray-300'} shrink-0`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-semibold text-sm text-gray-800 truncate pr-2">{reminder.title}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium capitalize shrink-0`}>{priText}</span>
                                                    </div>

                                                    {reminder.message && (
                                                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{truncate(reminder.message, 60)}</p>
                                                    )}

                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{fullDateStr}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Action Buttons */}
                                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                                                <div className="overflow-hidden">
                                                    <div className="mt-3 flex justify-end gap-2 pt-2 border-t border-gray-50">
                                                        <button
                                                            onClick={() => {
                                                                fetch(`/api/reminders/${reminder.id}`, { method: "PUT", body: JSON.stringify({ status: "completed" }) })
                                                                    .then(async () => {
                                                                        const res = await fetch("/api/reminders");
                                                                        const data = await res.json();
                                                                        setReminders(data.reminders || []);
                                                                    });
                                                            }}
                                                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                            title={locale === "ar" ? "إكمال" : "Complete"}
                                                        >
                                                            <CheckSquare className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSnoozeId(reminder.id); setSnoozeOpen(true); }}
                                                            className="p-1.5 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                            title={locale === "ar" ? "تأجيل" : "Snooze"}
                                                        >
                                                            <Clock className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setViewId(reminder.id); setViewOpen(true); }}
                                                            className="p-1.5 rounded-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors"
                                                            title={locale === "ar" ? "معاينة" : "Preview"}
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                fetch(`/api/reminders/${reminder.id}`, { method: "PUT", body: JSON.stringify({ status: "dismissed" }) })
                                                                    .then(async () => {
                                                                        const res = await fetch("/api/reminders");
                                                                        const data = await res.json();
                                                                        setReminders(data.reminders || []);
                                                                    });
                                                            }}
                                                            className="p-1.5 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                            title={locale === "ar" ? "إغلاق" : "Close"}
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Row 4: Upcoming Deadlines & Bottom Analytics combined */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Upcoming Deadlines - 2 Columns - Modern Design */}
                <div className="lg:col-span-2 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                    <div className="p-4 px-6 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                        <h3 className="text-[14px] font-semibold text-gray-800 text-center">{t("upcomingDeadlines") || "Upcoming Deadlines"}</h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4 h-[630px] overflow-y-auto custom-scrollbar">
                            {upcomingDeadlines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-center text-[14px]">{t("noDeadlines") || "No upcoming deadlines."}</p>
                                </div>
                            ) : (
                                upcomingDeadlines.map((item) => {
                                    const now = new Date(nowTick);
                                    const start = parseISO(item.startTime);
                                    const diff = start.getTime() - now.getTime();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                    const isUrgent = diff < 48 * 60 * 60 * 1000;
                                    const indicatorColor = isUrgent ? "bg-red-500" : "bg-orange-400";
                                    const badgeColor = isUrgent
                                        ? { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" }
                                        : { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" };

                                    const fullDateStr = start.toLocaleString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                    const timeLeft = days > 0
                                        ? (locale === "ar" ? `${days} يوم متبقي` : `${days} days left`)
                                        : (hours > 0 ? (locale === "ar" ? `${hours} ساعة متبقية` : `${hours} hours left`) : (locale === "ar" ? "قريباً جداً" : "Very soon"));

                                    const Container: any = (item.source === 'event') ? Link : 'div';
                                    // We use 'div' mostly now to avoid button-in-link issues, but for deadlines we can wrap the whole thing if we are careful.
                                    // Actually, let's use Div to keep it consistent with the "Reminders" pattern which has specific buttons.

                                    return (
                                        <div key={`${item.source}-${item.id}`} className="group relative p-4 rounded-[15px] border border-gray-100 bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-gray-200 transition-all overflow-hidden">
                                            <div className="flex gap-3 relative z-10">
                                                <div className={`w-1 rounded-full ${indicatorColor} shrink-0`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-semibold text-sm text-gray-800 truncate pr-2">{item.title}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeColor.bg} ${badgeColor.text} font-medium capitalize shrink-0`}>
                                                            {locale === "ar" ? "موعد نهائي" : "Deadline"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                        <Hash className="h-3 w-3 text-gray-400" />
                                                        <span>{locale === "en" ? "Case # " : "القضية # "}{item.caseNumber !== null ? item.caseNumber : (locale === "en" ? "no related case" : "لا يوجد قضية مرتبطة")}</span>
                                                    </div>

                                                    {(item.description) && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 line-clamp-1">
                                                            <FileText className="h-3 w-3 text-gray-400" />
                                                            <span>{item.description.slice(0, 60)}...</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <span className="font-medium text-gray-600">{fullDateStr}</span>
                                                        <div className="mx-1 h-1 w-1 rounded-full bg-gray-300"></div>
                                                        <span className={`${isUrgent ? "text-red-500 font-bold" : "text-gray-400"}`}>{timeLeft}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Action Buttons */}
                                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                                                <div className="overflow-hidden">
                                                    <div className="mt-3 flex justify-end gap-2 pt-2 border-t border-gray-50">
                                                        <button
                                                            onClick={async () => {
                                                                if (item.source === 'event') {
                                                                    try {
                                                                        const res = await fetch(`/api/events/${item.id}`);
                                                                        if (!res.ok) {
                                                                            console.error("Failed to fetch event details");
                                                                            return;
                                                                        }
                                                                        const data = await res.json();
                                                                        // Transform for EventModal
                                                                        const modalData = {
                                                                            id: data.id,
                                                                            title: data.title,
                                                                            start: data.startTime,
                                                                            end: data.endTime,
                                                                            allDay: data.allDay,
                                                                            extendedProps: {
                                                                                description: data.description,
                                                                                location: data.location,
                                                                                type: data.eventType || 'other',
                                                                                meetingLink: data.meetingLink,
                                                                                caseId: data.caseId,
                                                                                assignees: data.assignees?.map((a: any) => a.userId) || []
                                                                            }
                                                                        };
                                                                        setSelectedEventData(modalData);
                                                                        setEventModalOpen(true);
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                } else {
                                                                    setViewId(item.id);
                                                                    setViewOpen(true);
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-center gap-2 p-2 rounded-md ${badgeColor.bg} ${badgeColor.text} hover:opacity-80 transition-opacity text-xs font-medium`}
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Vertical Stack of Analytics - 1 Column */}
                <div className="space-y-4">
                    {/* Open vs Closed */}
                    <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                        <div className="p-4 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                            <h3 className="text-[14px] font-semibold text-gray-800 text-center">
                                {locale === "ar" ? "القضايا الجارية مقابل المغلقة" : "Open vs Closed Cases"}
                            </h3>
                        </div>
                        <div className="py-6 px-4 md:px-8 space-y-4">
                            {(() => {
                                const total = (stats?.totalCases || 0);
                                const open = (stats?.activeCases || 0);
                                const closed = closedCasesTotal || 0;
                                const openPct = total > 0 ? Math.min(100, (open / total) * 100) : 0;
                                const closedPct = total > 0 ? Math.min(100, (closed / total) * 100) : 0;
                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700 font-medium">{locale === "ar" ? "القضايا الجارية" : "Open Cases"}</p>
                                                <p className="text-sm text-emerald-600 font-semibold">{open}</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${openPct}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700 font-medium">{locale === "ar" ? "القضايا المغلقة" : "Closed Cases"}</p>
                                                <p className="text-sm text-gray-600 font-semibold">{closed}</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                                <div className="h-2 rounded-full bg-gray-500" style={{ width: `${closedPct}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="text-center text-sm text-gray-500 font-semibold pt-4">
                                            {locale === "ar" ? "إجمالي القضايا" : "Total Cases"} {total}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Cases by Year */}
                    <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                        <div className="p-4 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                            <h3 className="text-[14px] font-semibold text-gray-800 text-center">
                                {locale === "ar" ? "القضايا حسب السنة" : "Cases by Year"}
                            </h3>
                        </div>
                        <div className="py-6 px-4 md:px-8 space-y-3">
                            {(() => {
                                const currentYear = new Date().getFullYear();
                                const years = [currentYear - 1, currentYear, currentYear + 1];
                                const total = years.reduce((acc, y) => acc + (casesByYear?.[y] || 0), 0);
                                return years.map((y) => {
                                    const count = casesByYear?.[y] || 0;
                                    const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
                                    return (
                                        <div key={y} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700 font-medium">{y}</p>
                                                <p className="text-sm text-gray-900 font-semibold">{count}</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="h-2 rounded-full bg-gray-300" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Client Activity */}
                    <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                        <div className="p-4 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                            <h3 className="text-[14px] font-semibold text-gray-800 text-center">
                                {locale === "ar" ? "حالة نشاط الموكلين" : "Client Activity"}
                            </h3>
                        </div>
                        <div className="py-6 px-4 md:px-8 space-y-4">
                            {(() => {
                                const total = clientStats?.totalClients || 0;
                                const active = clientStats?.activeClients || 0;
                                const inactive = Math.max(0, total - active);
                                const activePct = total > 0 ? Math.min(100, (active / total) * 100) : 0;
                                const inactivePct = total > 0 ? Math.min(100, (inactive / total) * 100) : 0;
                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700 font-medium">{locale === "ar" ? "الموكلين النشطون" : "Active Clients"}</p>
                                                <p className="text-sm text-emerald-600 font-semibold">{active}</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${activePct}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700 font-medium">{locale === "ar" ? "الموكلين غير النشطين" : "Inactive Clients"}</p>
                                                <p className="text-sm text-gray-600 font-semibold">{inactive}</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                                <div className="h-2 rounded-full bg-gray-500" style={{ width: `${inactivePct}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="text-center text-sm text-gray-500 font-semibold pt-4">
                                            {locale === "ar" ? "إجمالي الموكلين " : "Total Clients "} {total}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Client Stats & Cases by Stage (Existing) */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Clients Statistics */}
                <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] lg:col-span-2 rounded-[15px] border border-gray-100">
                    <div className="p-4 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                        <h3 className="text-[14px] font-semibold text-gray-800 text-center">
                            {locale === "ar" ? "إحصائيات الموكلين" : "Clients Statistics"}
                        </h3>
                    </div>
                    <div className="py-6 px-4 md:px-14 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-1 flex items-center justify-center">
                            <div className="relative w-40 h-40 rounded-full bg-gray-50 flex items-center justify-center border-8 border-gray-100">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-slate-700">
                                        {clientStats?.totalClients || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{locale === "ar" ? "إجمالي الموكلين" : "Total Clients"}</div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 grid gap-3">
                            {[
                                { key: "individual", labelAr: "فرد", labelEn: "Individual", color: "bg-brand-primary" },
                                { key: "company", labelAr: "شركة", labelEn: "Company", color: "bg-brand-secondary" },
                                { key: "government", labelAr: "حكومة", labelEn: "Government", color: "bg-emerald-600" },
                                { key: "organization", labelAr: "مؤسسة", labelEn: "Organization", color: "bg-yellow-500" },
                            ].map((t) => {
                                const count = clientStats?.clientsByType?.[t.key] || 0;
                                const total = clientStats?.totalClients || 0;
                                const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
                                return (
                                    <div key={t.key} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 justify-between mb-1">
                                                <p className="text-sm text-gray-700 font-medium">{locale === "ar" ? t.labelAr : t.labelEn}</p>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div className={`h-2 rounded-full ${t.color}`} style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <p className="text-sm text-gray-900 font-semibold">{count}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cases Statistics by Stage */}
                <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[15px] border border-gray-100">
                    <div className="p-4 bg-gray-50/50 rounded-t-[15px] border-b border-gray-100">
                        <h3 className="text-[14px] font-semibold text-gray-800 text-center">
                            {locale === "ar" ? "إحصائيات القضايا" : "Cases Statistics"}
                        </h3>
                    </div>
                    <div className="py-6 px-4 md:px-8 space-y-4">
                        {(() => {
                            const stageLabels: Record<string, { ar: string; en: string }> = {
                                under_preparation: { ar: "قيد التحضير", en: "Under Preparation" },
                                first_instance: { ar: "ابتدائية", en: "First Instance" },
                                appeal: { ar: "استئناف", en: "Appeal" },
                                execution: { ar: "تنفيذ", en: "Execution" },
                                cassation: { ar: "نقض", en: "Cassation" },
                                other: { ar: "أخرى", en: "Other" },
                            };
                            const total = stats?.totalCases || 0;
                            const color = "bg-gray-300";
                            return (stats?.casesByStage || []).map((row: any) => {
                                const label = locale === "ar" ? (stageLabels[row.stage]?.ar || row.stage) : (stageLabels[row.stage]?.en || row.stage);
                                const count = row.count || 0;
                                const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
                                return (
                                    <div key={row.stage} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-700 font-medium">{label}</p>
                                            <p className="text-sm text-gray-900 font-semibold">{count}</p>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        {(!stats?.casesByStage || stats?.casesByStage.length === 0) && (
                            <p className="text-center text-gray-400 text-[14px] py-4">{locale === "ar" ? "لا توجد بيانات" : "No data"}</p>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={snoozeOpen} onClose={() => setSnoozeOpen(false)} title={locale === "ar" ? "تأجيل التذكير" : "Snooze Reminder"}>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => handleSnooze(addDays(new Date(), 1).setHours(9, 0, 0, 0))}
                            className="w-full p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-center transition-colors"
                        >
                            <div className="font-semibold text-gray-800">{locale === "ar" ? "غداً" : "Tomorrow"}</div>
                            <div className="text-xs text-gray-500">9:00 AM</div>
                        </button>
                        <button
                            onClick={() => handleSnooze(addWeeks(new Date(), 1).setHours(9, 0, 0, 0))}
                            className="w-full p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-center transition-colors"
                        >
                            <div className="font-semibold text-gray-800">{locale === "ar" ? "الأسبوع القادم" : "Next Week"}</div>
                            <div className="text-xs text-gray-500">9:00 AM</div>
                        </button>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">{locale === "ar" ? "تأجيل حتى" : "Snooze Until"}</div>
                        <DateTimeInput value={snoozeDate} onChange={setSnoozeDate} locale={locale} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <ModalButton variant="outline" onClick={() => setSnoozeOpen(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</ModalButton>
                        <ModalButton color="brand" onClick={() => handleSnooze(snoozeDate)} disabled={!snoozeDate}>{locale === "ar" ? "حفظ" : "Save"}</ModalButton>
                    </div>
                </div>
            </Modal>

            <ReminderEditModal open={viewOpen} onClose={() => setViewOpen(false)} id={viewId} readOnly />

            <EventModal
                isOpen={eventModalOpen}
                onClose={() => setEventModalOpen(false)}
                initialData={selectedEventData}
                onSave={async () => { }} // Read only
                isRTL={locale === 'ar'}
                readOnly={true}
            />
        </div>
    );
}
