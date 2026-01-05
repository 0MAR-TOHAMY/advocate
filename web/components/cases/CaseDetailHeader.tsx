"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Clock, User, ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { cn } from "@/lib/utils";

interface CaseDetailHeaderProps {
    caseData: any;
    locale: string;
    t: any;
    onEdit: () => void;
    onAssign: () => void;
    onChangeStatus: () => void;
    onDelete: () => void;
}

export function CaseDetailHeader({
    caseData,
    locale,
    t,
    onEdit,
    onAssign,
    onChangeStatus,
    onDelete
}: CaseDetailHeaderProps) {
    const isRtl = locale === "ar";

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "text-emerald-600 bg-emerald-50";
            case "closed": return "text-gray-600 bg-gray-100";
            case "decided": return "text-rose-600 bg-rose-50";
            case "pending": return "text-amber-600 bg-amber-50";
            case "archived": return "text-blue-600 bg-blue-50";
            default: return "text-gray-500 bg-gray-50";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "text-rose-600 bg-rose-50";
            case "high": return "text-orange-600 bg-orange-50";
            case "medium": return "text-blue-600 bg-blue-50";
            default: return "text-gray-500 bg-gray-50";
        }
    };

    return (
        <div className="relative mb-6">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-4">
                        {/* Breadcrumbs / Back */}
                        <Link
                            href={`/${locale}/dashboard/cases`}
                            className="group inline-flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors duration-300"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{t("backToCases")}</span>
                        </Link>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                    {caseData.title}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("caseNumber")}:</span>
                                    <span className="font-bold text-gray-900">{caseData.caseNumber || "-"}</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("caseYear")}:</span>
                                    <span className="font-bold text-gray-900">{caseData.caseYear}</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("priority")}:</span>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide", getPriorityColor(caseData.priority))}>
                                        {t(`priorities.${caseData.priority}`)}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("status")}:</span>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide", getStatusColor(caseData.status))}>
                                        {t(`statuses.${caseData.status}`)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 sm:flex items-center gap-2">
                        <ModalButton
                            onClick={onEdit}
                            className="!h-12 !px-4 rounded-2xl !bg-brand-primary/10 !text-brand-primary hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Edit className="w-3 h-3 text-brand-primary" />
                            {t("editCase")}
                        </ModalButton>

                        <ModalButton
                            onClick={onAssign}
                            className="!h-12 !px-6 rounded-2xl !bg-indigo-500/10 !text-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <User className="w-3 h-3 text-indigo-500" />
                            {isRtl ? "تعيين" : "Assign"}
                        </ModalButton>

                        <ModalButton
                            onClick={onChangeStatus}
                            className="!h-12 !px-6 rounded-2xl !bg-blue-500/10 !text-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Clock className="w-3 h-3 text-blue-500" />
                            {isRtl ? "تغيير الحالة" : "Status"}
                        </ModalButton>

                        <ModalButton
                            onClick={onDelete}
                            className="!h-12 !px-6 rounded-2xl !bg-rose-500/10 !text-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-rose-600 font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            {t("deleteCase")}
                        </ModalButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
