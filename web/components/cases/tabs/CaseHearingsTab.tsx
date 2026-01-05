"use client";

import React from "react";
import { Gavel, Eye, Calendar, Plus, Info, Pencil, Trash2, Clock } from "lucide-react";
import { UniversalTabSection } from "./UniversalTabSection";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface CaseHearingsTabProps {
    hearings: any[];
    locale: string;
    t: any;
    tHear: any;
    tCommon: any;
    onSchedule: () => void;
    onEdit?: (hearing: any) => void;
    onDelete?: (hearing: any) => void;
    onPostpone?: (hearing: any) => void;
    // Added for better integration
    loading?: boolean;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

export function CaseHearingsTab({
    hearings,
    locale,
    t,
    tHear,
    tCommon,
    onSchedule,
    onEdit,
    onDelete,
    onPostpone,
    loading = false,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange
}: CaseHearingsTabProps) {
    const isRtl = locale === "ar";

    const getHearingTypeColor = (type: string) => {
        switch (type) {
            case "online": return "!bg-blue-50 !text-blue-600";
            case "offline": return "!bg-gray-100 !text-gray-600";
            default: return "!bg-gray-50 !text-gray-500";
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case "first_instance": return "!bg-emerald-50 !text-emerald-600";
            case "appeal": return "!bg-amber-50 !text-amber-600";
            case "cassation": return "!bg-purple-50 !text-purple-600";
            case "execution": return "!bg-rose-50 !text-rose-600";
            default: return "!bg-gray-50 !text-gray-500";
        }
    };

    return (
        <UniversalTabSection
            title={tHear("title")}
            icon={Gavel}
            count={totalCount || hearings.length}
            countLabel={isRtl ? "جلسات إجمالية" : "Total Hearings"}
            addButtonLabel={t("scheduleHearing")}
            onAdd={onSchedule}
            data={hearings}
            loading={loading}
            isRtl={isRtl}
            colorScheme="indigo"
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            emptyTitle={isRtl ? "لا توجد جلسات مجدولة" : "No Hearings Scheduled"}
            emptyDescription={isRtl
                ? "لم يتم تحديد أي مواعيد جلسات لهذه القضية بعد."
                : "No hearing dates have been set for this case yet."}
            tipIcon={Calendar}
            tipTitle={isRtl ? "تنبيه المواعيد" : "Hearing Schedule Tip"}
            tipDescription={isRtl
                ? "تتم مزامنة جميع الجلسات تلقائياً مع تقويم المكتب. ستصلك تنبيهات قبل موعد الجلسة بـ 24 ساعة."
                : "All hearings are automatically synced with the office calendar. You will receive notifications 24 hours before the hearing date."}
        >
            <table className="w-full text-start">
                <thead>
                    <tr className="border-b border-gray-50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tHear("columns.number")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tHear("columns.date")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tHear("columns.type")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tHear("columns.stage")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tHear("columns.actions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {hearings.map((h) => (
                        <tr key={h.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                        <Gavel className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="font-bold text-gray-900 uppercase text-[12px] tracking-wider">{isRtl ? "جلسة رقم" : "Hearing"} #{h.hearingNumber}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-gray-900">
                                        {new Date(h.hearingDate).toLocaleString(locale, { day: "numeric", month: "long" })}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {new Date(h.hearingDate).toLocaleString(locale, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <Badge className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none ${getHearingTypeColor(h.hearingType)}`}>
                                    {tHear(`types.${h.hearingType}`)}
                                </Badge>
                            </td>
                            <td className="px-8 py-4">
                                <Badge className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none ${getStageColor(h.stage)}`}>
                                    {t(`stages.${h.stage}`) || h.stage || "-"}
                                </Badge>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Link
                                        href={`/${locale}/dashboard/hearings/${h.id}`}
                                        className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all duration-300"
                                        title={tHear("view")}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Link>
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(h)}
                                            className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-all duration-300"
                                            title={tCommon("edit")}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {onPostpone && (
                                        <button
                                            onClick={() => onPostpone(h)}
                                            className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-all duration-300"
                                            title={tHear("postponeTitle")}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(h)}
                                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all duration-300"
                                            title={tCommon("delete")}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </UniversalTabSection>
    );
}
