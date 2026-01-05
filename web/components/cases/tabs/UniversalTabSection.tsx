"use client";

import React from "react";
import { Plus, Info, ChevronLeft, ChevronRight } from "lucide-react";
import ModalButton from "@/components/ui/ModalButton";

interface UniversalTabSectionProps {
    title: string;
    icon: React.ElementType;
    count: number;
    countLabel: string;
    addButtonLabel?: string;
    onAdd?: () => void;

    data: any[];
    loading?: boolean;

    // Empty State
    emptyIcon?: React.ElementType;
    emptyTitle?: string;
    emptyDescription?: string;

    // Table content
    children?: React.ReactNode;

    // Pagination
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;

    // Tip section
    tipIcon?: React.ElementType;
    tipTitle?: string;
    tipDescription?: string;

    isRtl?: boolean;
    colorScheme?: 'brand' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
}

const colorMap = {
    brand: {
        bg: "bg-brand-primary/10",
        icon: "text-brand-primary",
        button: "!bg-brand-primary",
        pagination: "bg-brand-primary",
        paginationShadow: "shadow-brand-primary/10",
        tipBg: "bg-brand-primary/5",
        tipBorder: "border-brand-primary/10",
        hoverBorder: "hover:border-brand-primary",
        hoverText: "hover:text-brand-primary"
    },
    indigo: {
        bg: "bg-indigo-50",
        icon: "text-indigo-600",
        button: "!bg-indigo-600",
        pagination: "bg-indigo-600",
        paginationShadow: "shadow-indigo-100",
        tipBg: "bg-indigo-50/50",
        tipBorder: "border-indigo-100/50",
        hoverBorder: "hover:border-indigo-600",
        hoverText: "hover:text-indigo-600"
    },
    emerald: {
        bg: "bg-emerald-50",
        icon: "text-emerald-600",
        button: "!bg-emerald-600",
        pagination: "bg-emerald-600",
        paginationShadow: "shadow-emerald-100",
        tipBg: "bg-emerald-50/50",
        tipBorder: "border-emerald-100/50",
        hoverBorder: "hover:border-emerald-600",
        hoverText: "hover:text-emerald-600"
    },
    rose: {
        bg: "bg-rose-50",
        icon: "text-rose-600",
        button: "!bg-rose-600",
        pagination: "bg-rose-600",
        paginationShadow: "shadow-rose-100",
        tipBg: "bg-rose-50/50",
        tipBorder: "border-rose-100/50",
        hoverBorder: "hover:border-rose-600",
        hoverText: "hover:text-rose-600"
    },
    amber: {
        bg: "bg-amber-50",
        icon: "text-amber-600",
        button: "!bg-amber-600",
        pagination: "bg-amber-600",
        paginationShadow: "shadow-amber-100",
        tipBg: "bg-amber-50/50",
        tipBorder: "border-amber-100/50",
        hoverBorder: "hover:border-amber-600",
        hoverText: "hover:text-amber-600"
    },
    blue: {
        bg: "bg-blue-50",
        icon: "text-blue-600",
        button: "!bg-blue-600",
        pagination: "bg-blue-600",
        paginationShadow: "shadow-blue-100",
        tipBg: "bg-blue-50/50",
        tipBorder: "border-blue-100/50",
        hoverBorder: "hover:border-blue-600",
        hoverText: "hover:text-blue-600"
    },
    purple: {
        bg: "bg-purple-50",
        icon: "text-purple-600",
        button: "!bg-purple-600",
        pagination: "bg-purple-600",
        paginationShadow: "shadow-purple-100",
        tipBg: "bg-purple-50/50",
        tipBorder: "border-purple-100/50",
        hoverBorder: "hover:border-purple-600",
        hoverText: "hover:text-purple-600"
    }
};

export function UniversalTabSection({
    title,
    icon: Icon,
    count,
    countLabel,
    addButtonLabel,
    onAdd,
    data,
    loading,
    emptyIcon: EmptyIcon,
    emptyTitle,
    emptyDescription,
    children,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange,
    tipIcon: TipIcon = Info,
    tipTitle,
    tipDescription,
    isRtl = false,
    colorScheme = 'brand'
}: UniversalTabSectionProps) {

    const showPagination = totalCount > 0 && !!onPageChange;
    const EffectiveEmptyIcon = EmptyIcon || Icon;
    const colors = colorMap[colorScheme] || colorMap.brand;

    return (
        <div className="space-y-4">
            {/* Header & Actions */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-[20px] ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            {count} {countLabel}
                        </p>
                    </div>
                </div>
                {onAdd && addButtonLabel && (
                    <ModalButton
                        onClick={onAdd}
                        className={`h-12 px-8 rounded-[20px] ${colors.button} text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3`}
                    >
                        <Plus className="w-4 h-4" />
                        {addButtonLabel}
                    </ModalButton>
                )}
            </div>

            {/* Main Body */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <div className={`w-12 h-12 border-4 ${colors.tipBorder} border-t-current ${colors.icon} rounded-full animate-spin`} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                            {isRtl ? "جاري التحميل..." : "Loading..."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {children && (
                            <div className="overflow-x-auto">
                                {children}
                            </div>
                        )}

                        {(!data || data.length === 0) && (
                            <div className="p-12 text-center space-y-2">
                                <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-1">
                                    <EffectiveEmptyIcon className="w-8 h-8 text-gray-200" />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                    {emptyTitle || (isRtl ? "لا توجد بيانات" : "No Data Found")}
                                </h4>
                                <p className="text-xs font-medium text-gray-400 max-w-[250px] mx-auto leading-tight">
                                    {emptyDescription || (isRtl ? "لم يتم العثور على أي سجلات." : "No records found.")}
                                </p>
                                {onAdd && addButtonLabel && (
                                    <ModalButton
                                        variant="outline"
                                        onClick={onAdd}
                                        className="mt-4 px-8 h-10 rounded-[16px] border-gray-200 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        {addButtonLabel}
                                    </ModalButton>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {showPagination && data && data.length > 0 && (
                            <div className="px-8 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {isRtl ? "عرض" : "Showing"} <span className="text-gray-900">{data.length}</span> {isRtl ? "من" : "of"} <span className="text-gray-900">{totalCount}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 bg-white ${colors.hoverBorder} ${colors.hoverText} transition-all disabled:opacity-20`}
                                    >
                                        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </button>
                                    <div className={`h-8 px-4 rounded-xl ${colors.pagination} text-white flex items-center justify-center text-[10px] font-black shadow-lg ${colors.paginationShadow}`}>
                                        {currentPage}
                                    </div>
                                    <button
                                        onClick={() => onPageChange(currentPage + 1)}
                                        disabled={currentPage * pageSize >= totalCount}
                                        className={`w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 bg-white ${colors.hoverBorder} ${colors.hoverText} transition-all disabled:opacity-20`}
                                    >
                                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tip Section */}
            {tipDescription && (
                <div className={`${colors.tipBg} p-6 rounded-[24px] border ${colors.tipBorder} flex items-start gap-4 transition-all hover:opacity-80`}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/[0.03]">
                        <TipIcon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div>
                        <h5 className={`text-[11px] font-black uppercase tracking-widest ${colors.icon} mb-1`}>
                            {tipTitle || (isRtl ? "نصيحة" : "Tip")}
                        </h5>
                        <p className="text-xs font-bold text-gray-500 leading-relaxed">
                            {tipDescription}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
