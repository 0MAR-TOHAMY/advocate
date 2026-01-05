"use client";

import React from "react";
import Link from "next/link";
import { Edit, Clock, User, ChevronRight, ChevronLeft, Calendar, Gavel, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { cn } from "@/lib/utils";

interface HearingDetailHeaderProps {
    hearing: any;
    locale: string;
    t: any;
    onEdit: () => void;
    onPostpone: () => void;
}

export function HearingDetailHeader({
    hearing,
    locale,
    t,
    onEdit,
    onPostpone
}: HearingDetailHeaderProps) {
    const isRtl = locale === "ar";

    const getStatusInfo = () => {
        if (!hearing) return { label: "", color: "text-gray-500 bg-gray-50", icon: null };
        const now = new Date();
        const hearingDate = new Date(hearing.hearingDate);

        if (hearing.isPostponed) {
            return {
                label: isRtl ? "مؤجلة" : "Postponed",
                color: "text-amber-600 bg-amber-50",
                icon: <AlertCircle className="w-3 h-3" />
            };
        }
        if (hearing.hasJudgment) {
            return {
                label: isRtl ? "صدر حكم" : "Judgment Issued",
                color: "text-purple-600 bg-purple-50",
                icon: <Gavel className="w-3 h-3" />
            };
        }
        if (hearingDate < now) {
            return {
                label: isRtl ? "منتهية" : "Completed",
                color: "text-gray-600 bg-gray-100",
                icon: <CheckCircle className="w-3 h-3" />
            };
        }
        return {
            label: isRtl ? "قادمة" : "Upcoming",
            color: "text-emerald-600 bg-emerald-50",
            icon: <Clock className="w-3 h-3" />
        };
    };

    const status = getStatusInfo();

    return (
        <div className="relative mb-6">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-4">
                        {/* Breadcrumbs / Back */}
                        <Link
                            href={`/${locale}/dashboard/hearings`}
                            className="group inline-flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors duration-300"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{isRtl ? "العودة للجلسات" : "Back to Hearings"}</span>
                        </Link>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                    {hearing.comments || (isRtl ? `الجلسة رقم H${hearing.hearingNumber}` : `Hearing H${hearing.hearingNumber}`)}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "القضية" : "Case"}:</span>
                                    <span className="font-bold text-gray-900">{hearing.caseTitle || hearing.caseNumber}</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "النوع" : "Type"}:</span>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-600")}>
                                        {t(`types.${hearing.hearingType}`)}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "الحالة" : "Status"}:</span>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5", status.color)}>
                                        {status.icon}
                                        {status.label}
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
                            {isRtl ? "تعديل الجلسة" : "Edit Hearing"}
                        </ModalButton>

                        <ModalButton
                            onClick={onPostpone}
                            className="!h-12 !px-6 rounded-2xl !bg-amber-500/10 !text-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-gray-700 font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Clock className="w-3 h-3 text-amber-500" />
                            {isRtl ? "تأجيل الجلسة" : "Postpone"}
                        </ModalButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
