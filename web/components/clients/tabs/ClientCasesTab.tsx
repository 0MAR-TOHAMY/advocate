"use client";

import React from "react";
import { Briefcase, Gavel, Calendar, Clock, Eye, AlertCircle, Hash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UniversalTabSection } from "../../cases/tabs/UniversalTabSection";

interface ClientCasesTabProps {
    cases: any[];
    locale: string;
    t: any;
    isLoading: boolean;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

export function ClientCasesTab({
    cases,
    locale,
    t,
    isLoading,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange
}: ClientCasesTabProps) {
    const isRtl = locale === "ar";

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "!bg-emerald-100 !text-emerald-500";
            case "closed": return "!bg-gray-100 !text-gray-500";
            case "decided": return "!bg-rose-100 !text-rose-500";
            case "pending": return "!bg-amber-100 !text-amber-500";
            case "archived": return "!bg-blue-100 !text-blue-500";
            default: return "!bg-gray-100 !text-gray-500";
        }
    };

    return (
        <UniversalTabSection
            title={t("relatedCases")}
            icon={Briefcase}
            count={totalCount || cases.length}
            countLabel={t("title")}
            data={cases}
            loading={isLoading}
            isRtl={isRtl}
            colorScheme="blue"
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            tipTitle={isRtl ? "إدارة القضايا" : "Case Management Tip"}
            tipDescription={isRtl
                ? "يمكنك متابعة حالة كل قضية والمرحلة الحالية من هنا. اضغط على 'عرض' لرؤية التفاصيل الكاملة."
                : "You can track the status and current stage of each case from here. Click 'View' to see full details."}
        >
            <table className="w-full text-start">
                <thead>
                    <tr className="border-b border-gray-50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("caseNumber")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("title")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("status")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("caseStage")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("filingDate")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{t("actions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {cases.map((item) => (
                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-mono italic">{item.caseNumber || "-"}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-gray-900 tracking-tight leading-tight">{item.title}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{t(`caseTypes.${item.caseType}`)}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <Badge className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-none", getStatusColor(item.status))}>
                                    {t(`statuses.${item.status}`)}
                                </Badge>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                    <Gavel className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="text-xs font-bold text-gray-700">
                                        {item.caseStage === "other" && item.customCaseStage ? item.customCaseStage : t(`stages.${item.caseStage}`)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="text-xs font-bold text-gray-700">
                                        {item.filingDate ? new Date(item.filingDate).toLocaleDateString(locale) : "-"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-4 text-center">
                                <Link
                                    href={`/${locale}/dashboard/cases/${item.id}`}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-300"
                                    title={t("view")}
                                >
                                    <Eye className="w-4 h-4" />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </UniversalTabSection>
    );
}

