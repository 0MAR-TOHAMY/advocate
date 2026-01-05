"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    Clock, User, CheckCircle2, History,
    MessageSquare, AlertCircle, FileText,
    Gavel, ArrowRight, PlusCircle, Calendar,
    Zap, DollarSign, Scale, Activity, ArrowUpRight,
    Info
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { UniversalTabSection } from "./tabs/UniversalTabSection";

type HistoryItem = {
    id: string;
    userName: string;
    action: string;
    fieldChanged: string | null;
    oldValue: string | null;
    newValue: string | null;
    notes: string | null;
    createdAt: string;
};

interface CaseTimelineProps {
    caseId: string;
}

export default function CaseTimeline({ caseId }: CaseTimelineProps) {
    const t = useTranslations("timeline");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchHistory(page);
    }, [caseId, page]);

    const fetchHistory = async (currentPage: number) => {
        setIsLoading(true);
        try {
            const searchParams = new URLSearchParams({
                page: String(currentPage),
                pageSize: String(pageSize)
            });
            const res = await fetch(`/api/cases/${caseId}/history?${searchParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.items || data || []);
                setTotalCount(data.total || (Array.isArray(data) ? data.length : 0));
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "created": return <PlusCircle className="h-4 w-4" />;
            case "status_changed": return <Activity className="h-4 w-4" />;
            case "document_added": return <FileText className="h-4 w-4" />;
            case "note_added": return <MessageSquare className="h-4 w-4" />;
            case "event_scheduled": return <Calendar className="h-4 w-4" />;
            case "judgment_recorded": return <Gavel className="h-4 w-4" />;
            case "expense_added": return <DollarSign className="h-4 w-4" />;
            default: return <Zap className="h-4 w-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "created": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "status_changed": return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case "judgment_recorded": return "bg-rose-50 text-rose-600 border-rose-100";
            case "closed": return "bg-slate-900 text-white border-slate-800";
            case "document_added": return "bg-blue-50 text-blue-600 border-blue-100";
            case "expense_added": return "bg-amber-50 text-amber-600 border-amber-100";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    const dateFormatter = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const getActionLabel = (item: HistoryItem) => {
        switch (item.action) {
            case "created": return t("createdCase");
            case "status_changed": return t("statusChanged");
            case "document_added": return t("documentAdded");
            case "note_added": return t("noteAdded");
            case "judgment_recorded": return t("judgmentRecorded");
            case "expense_added": return t("expenseAdded");
            case "event_scheduled": return t("eventScheduled");
            default: return item.action;
        }
    };

    return (
        <UniversalTabSection
            title={t("title")}
            icon={History}
            count={totalCount}
            countLabel={t("recordedActivities") || (isRtl ? "نشاط مسجل" : "Activities Recorded")}
            data={history}
            loading={isLoading}
            isRtl={isRtl}
            colorScheme="brand"
            totalCount={totalCount}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            emptyTitle={t("noHistory") || (isRtl ? "لا توجد نشاطات مسجلة" : "No Activity Recorded")}
            emptyDescription={isRtl
                ? "لم يتم تسجيل أي تغييرات أو نشاطات لهذه القضية بعد."
                : "No changes or activities have been recorded for this case yet."}
            tipIcon={Info}
            tipTitle={isRtl ? "السجل الزمني للأمان" : "Activity Log for Security"}
            tipDescription={isRtl
                ? "يتم تسجيل جميع الإجراءات الهامة تلقائياً لضمان النزاهة والقدرة على تتبع مسار القضية."
                : "All significant actions are automatically logged to ensure integrity and the ability to track the case journey."}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-start">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "النوع" : "Type"}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "الإجراء / التفاصيل" : "Action / Details"}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "المستخدم" : "User"}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "التاريخ" : "Date"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item) => (
                            <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                                            getActionColor(item.action)
                                        )}>
                                            {getActionIcon(item.action)}
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-gray-100 text-gray-400">
                                            {getActionLabel(item)}
                                        </Badge>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-col gap-1 max-w-[400px]">
                                        <div className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-tight whitespace-pre-wrap">
                                            {item.action === "status_changed" ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-gray-400 font-medium lowercase italic text-[11px] tracking-normal">
                                                        {t("changedStatus") || (isRtl ? "تغيير الحالة" : "changed status")}
                                                    </span>
                                                    <div className="flex items-center gap-2 bg-gray-50/50 px-2 py-1 rounded-lg border border-gray-100">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.oldValue}</span>
                                                        <ArrowRight className={cn("h-3 w-3 text-gray-300", isRtl && "rotate-180")} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{item.newValue}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span>
                                                    {item.action === "created" ? t("createdCase") : (item.notes || item.action)}
                                                </span>
                                            )}
                                        </div>
                                        {item.notes && item.action === "status_changed" && (
                                            <p className="text-[11px] text-gray-400 font-medium italic whitespace-pre-wrap">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">{item.userName}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-2 text-gray-400 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                        {dateFormatter.format(new Date(item.createdAt))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </UniversalTabSection>
    );

}

