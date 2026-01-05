/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import NewReminderModal from "@/components/reminders/NewReminderModal";
import ReminderEditModal from "@/components/reminders/ReminderEditModal";
import { Clock, CalendarDays, CheckCircle, AlertTriangle, Search, Trash2, Edit, XCircle, CheckSquare, Plus, Hash } from "lucide-react";
import { parseISO, isToday, isPast } from "date-fns"; // Removed format
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import AlertModal from "@/components/ui/AlertModal";

export default function RemindersPage() {
    const t = useTranslations("dashboard");
    const tRem = useTranslations("reminders");
    const commonT = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "ar";

    const [reminders, setReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingOpen, setEditingOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const truncate = (s: string | null | undefined, n: number) => {
        const t = s || "";
        return t.length > n ? t.slice(0, n) + "…" : t;
    };

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const fetchData = async () => {
        try {
            const res = await fetch("/api/reminders?include=all");
            const data = await res.json();
            setReminders(data.reminders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const total = reminders.length;
        const active = reminders.filter(r => r.status === "active").length;
        const dueToday = reminders.filter(r => r.dueDate && isToday(parseISO(r.dueDate))).length;
        // Late now includes ANY active reminder in the past, including today's earlier times
        const late = reminders.filter(r => r.dueDate && isPast(parseISO(r.dueDate)) && r.status === "active").length;
        const completed = reminders.filter(r => r.status === "completed").length;
        return { total, active, dueToday, late, completed };
    }, [reminders]);

    const filteredReminders = useMemo(() => {
        return reminders.filter(r => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = r.title.toLowerCase().includes(query) || (r.message && r.message.toLowerCase().includes(query));
            const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
            const matchesPriority = priorityFilter === "all" ? true : r.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [reminders, searchQuery, statusFilter, priorityFilter]);

    const [alertConfig, setAlertConfig] = useState<{
        open: boolean;
        type: "info" | "success" | "warning" | "error";
        title?: string;
        message: string;
        onConfirm?: () => void;
    }>({ open: false, type: "info", message: "" });


    const priorityColors: Record<string, string> = {
        low: "bg-emerald-50 text-emerald-700 border-emerald-100",
        medium: "bg-blue-50 text-blue-700 border-blue-100",
        high: "bg-orange-50 text-orange-700 border-orange-100",
        urgent: "bg-red-50 text-red-700 border-red-100"
    };

    const handleAction = (id: string, action: "delete" | "complete" | "dismiss") => {
        const title = action === "delete" ? (locale === "ar" ? "حذف التذكير" : "Delete Reminder") :
            action === "complete" ? (locale === "ar" ? "إكمال التذكير" : "Complete Reminder") :
                (locale === "ar" ? "إلغاء التذكير" : "Dismiss Reminder");

        const message = action === "delete" ? tRem("confirmDelete") :
            action === "complete" ? (locale === "ar" ? "هل أنت متأكد من وضع علامة مكتمل على هذا التذكير؟" : "Are you sure you want to mark this reminder as completed?") :
                (locale === "ar" ? "هل أنت متأكد من إلغاء هذا التذكير؟" : "Are you sure you want to dismiss this reminder?");

        setAlertConfig({
            open: true,
            type: "warning",
            title,
            message,
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, open: false }));
                try {
                    if (action === "delete") {
                        await fetch(`/api/reminders/${id}`, { method: "DELETE" });
                    } else {
                        const status = action === "complete" ? "completed" : "dismissed";
                        await fetch(`/api/reminders/${id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status })
                        });
                    }
                    fetchData();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    };

    const statCards = [
        { label: locale === "ar" ? "جميع التذكيرات" : "All Reminders", count: stats.total, icon: CalendarDays, color: "bg-blue-500/10 text-blue-500" },
        { label: locale === "ar" ? "نشطة" : "Active", count: stats.active, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
        { label: locale === "ar" ? "مستحقة اليوم" : "Due Today", count: stats.dueToday, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
        { label: locale === "ar" ? "متأخرة" : "Late", count: stats.late, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
        { label: locale === "ar" ? "مكتملة" : "Completed", count: stats.completed, icon: CheckCircle, color: "bg-gray-50 text-gray-600" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">{t("reminders")}</h1>
                    <p className="text-gray-500 text-[14px]">{locale === "ar" ? "عرض التذكيرات وإدارتها" : "View and manage reminders"}</p>
                </div>
                <Button onClick={() => setAdding(true)} className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {locale === "ar" ? "إضافة تذكير" : "Add Reminder"}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-[15px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.count}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px]">
                <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={locale === "ar" ? "بحث..." : "Search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery((e.target as any).value)}
                            className="pl-10 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: "all", label: locale === "ar" ? "كل الحالات" : "All Statuses" },
                                { value: "active", label: locale === "ar" ? "نشط" : "Active" },
                                { value: "completed", label: locale === "ar" ? "مكتمل" : "Completed" },
                                { value: "snoozed", label: locale === "ar" ? "مؤجل" : "Snoozed" },
                                { value: "dismissed", label: locale === "ar" ? "ملغى" : "Dismissed" },
                            ]}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            options={[
                                { value: "all", label: locale === "ar" ? "كل الأولويات" : "All Priorities" },
                                { value: "low", label: locale === "ar" ? "منخفض" : "Low" },
                                { value: "medium", label: locale === "ar" ? "متوسط" : "Medium" },
                                { value: "high", label: locale === "ar" ? "عالٍ" : "High" },
                                { value: "urgent", label: locale === "ar" ? "عاجل" : "Urgent" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Reminders List */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
                <NewReminderModal
                    open={adding}
                    onClose={() => setAdding(false)}
                    onCreated={() => { setLoading(true); fetchData(); }}
                />

                {loading ? (
                    <div className="py-10 flex justify-center"><Loader /></div>
                ) : filteredReminders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-[14px]">{t("noReminders")}</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredReminders.map((reminder) => {
                            const pColor = priorityColors[reminder.priority] || priorityColors.medium;
                            const isRTL = locale === "ar";
                            const formattedDate = reminder.dueDate
                                ? new Date(reminder.dueDate).toLocaleString(locale, {
                                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                                : "-";

                            return (
                                <div key={reminder.id} className="relative flex flex-col overflow-hidden md:flex-row items-stretch md:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white">
                                    {/* Priority Strip */}
                                    <div className={`absolute top-0 bottom-0 w-1.5 ${pColor.split(" ")[0]}`} style={{ [isRTL ? "right" : "left"]: 0 }}></div>

                                    <div className={`flex-1 ${isRTL ? "pr-4" : "pl-4"}`}>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase ${pColor}`}>
                                                {tRem(`priorities.${reminder.priority}`)}
                                            </span>
                                            {reminder.status === "completed" && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium uppercase">
                                                    {locale === "ar" ? "مكتمل" : "Completed"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <Hash className="w-3.5 h-3.5 text-gray-400" />
                                            <span>
                                                {reminder.caseNumber ? (
                                                    `${locale === "en" ? "Case #" : "القضية رقم"} ${reminder.caseNumber}`
                                                ) : (
                                                    locale === "en" ? "no related case" : "لا توجد قضية مرتبطة"
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2 mt-2 line-clamp-2 leading-relaxed">
                                            {truncate(reminder.message, 100)}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <div className={`flex items-center gap-1 ${reminder.dueDate && isPast(parseISO(reminder.dueDate)) && reminder.status === 'active' ? 'text-red-600 font-bold' : ''}`}>
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="font-medium" dir="ltr">{formattedDate}</span>
                                                {reminder.dueDate && isPast(parseISO(reminder.dueDate)) && reminder.status === 'active' && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md mx-1">
                                                        {locale === "ar" ? "متأخر" : "Overdue"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-center">

                                        <button
                                            onClick={() => { setEditingId(reminder.id); setViewMode(true); setEditingOpen(true); }}
                                            className="px-3 py-1.5 flex items-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center"><Search className="w-3 h-3" /></div>
                                            <span className="text-[11px] font-bold">{locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
                                        </button>

                                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                        <button
                                            onClick={() => { setEditingId(reminder.id); setViewMode(false); setEditingOpen(true); }}
                                            className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                            title={locale === "ar" ? "تعديل" : "Edit"}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        {reminder.status !== "dismissed" && reminder.status !== "completed" && (
                                            <button
                                                onClick={() => handleAction(reminder.id, "dismiss")}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title={locale === "ar" ? "إغلاق" : "Close"}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        {reminder.status !== "completed" && (
                                            <button
                                                onClick={() => handleAction(reminder.id, "complete")}
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title={locale === "ar" ? "إكمال" : "Complete"}
                                            >
                                                <CheckSquare className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleAction(reminder.id, "delete")}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title={locale === "ar" ? "حذف" : "Delete"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ReminderEditModal
                open={editingOpen}
                onClose={() => setEditingOpen(false)}
                id={editingId}
                onSaved={() => { setLoading(true); fetchData(); }}
                readOnly={viewMode}
            />

            <AlertModal
                isOpen={alertConfig.open}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                onConfirm={alertConfig.onConfirm}
                confirmText={locale === 'ar' ? 'نعم، متأكد' : 'Yes, I am sure'}
                cancelText={locale === 'ar' ? 'إلغاء' : 'Cancel'}
            />
        </div>
    );
}

