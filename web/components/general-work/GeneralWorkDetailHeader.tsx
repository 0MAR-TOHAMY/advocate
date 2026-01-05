/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
    Edit, Clock, ChevronRight, ChevronLeft,
    Calendar, AlertCircle, CheckCircle2, Trash2
} from "lucide-react";
import ModalButton from "@/components/ui/ModalButton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GeneralWorkDetailHeaderProps {
    work: any;
    locale: string;
    t: any;
    onEdit: () => void;
    onDelete: () => void;
    onComplete: () => void;
}

export function GeneralWorkDetailHeader({
    work,
    locale,
    t,
    onEdit,
    onDelete,
    onComplete
}: GeneralWorkDetailHeaderProps) {
    const isRtl = locale === "ar";
    const tCommon = useTranslations("common");

    const getStatusInfo = () => {
        if (!work) return { label: "", color: "text-gray-500 bg-gray-50", icon: Clock };
        switch (work.status) {
            case "completed":
                return {
                    color: "text-emerald-600 bg-emerald-50",
                    icon: CheckCircle2,
                    label: t("statuses.completed")
                };
            case "in_progress":
                return {
                    color: "text-blue-600 bg-blue-50",
                    icon: Clock,
                    label: t("statuses.in_progress")
                };
            case "pending":
                return {
                    color: "text-orange-600 bg-orange-50",
                    icon: AlertCircle,
                    label: t("statuses.pending")
                };
            case "cancelled":
                return {
                    color: "text-red-600 bg-red-50",
                    icon: AlertCircle,
                    label: t("statuses.cancelled")
                };
            default:
                return {
                    color: "text-gray-600 bg-gray-100",
                    icon: Clock,
                    label: work.status
                };
        }
    };

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    return (
        <div className="relative mb-6">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-4">
                        {/* Breadcrumbs / Back */}
                        <Link
                            href={`/${locale}/dashboard/general-work`}
                            className="group inline-flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors duration-300"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{t("backToWork")}</span>
                        </Link>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                    {work.title || (isRtl ? `عمل #${work.workNumber}` : `Work #${work.workNumber}`)}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "رقم العمل" : "Work No"}:</span>
                                    <span className="font-bold text-gray-900">#{work.workNumber}</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "النوع" : "Type"}:</span>
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-600">
                                        {work.workType ? t(`workTypes.${work.workType}`) : "-"}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRtl ? "الحالة" : "Status"}:</span>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5", status.color)}>
                                        <StatusIcon className="w-3 h-3" />
                                        {status.label}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("lastUpdated")}:</span>
                                    <span className="font-bold text-gray-900">{format(new Date(work.updatedAt), "yyyy/MM/dd")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="flex flex-wrap items-center gap-2">
                        <ModalButton
                            onClick={onDelete}
                            className="!h-12 !px-4 rounded-2xl !bg-red-50 !text-red-600 hover:shadow-md hover:-translate-y-0.5 transition-all font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-3 h-3" />
                            {t("deleteWork")}
                        </ModalButton>

                        <ModalButton
                            onClick={onEdit}
                            className="!h-12 !px-4 rounded-2xl !bg-brand-primary/10 !text-brand-primary hover:shadow-md hover:-translate-y-0.5 transition-all font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Edit className="w-3 h-3" />
                            {t("editWork")}
                        </ModalButton>

                        {work.status !== "completed" && (
                            <ModalButton
                                onClick={onComplete}
                                className="!h-12 !px-6 rounded-2xl !bg-emerald-600 !text-white hover:shadow-md hover:-translate-y-0.5 transition-all font-black uppercase !text-[10px] tracking-widest flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                {t("markAsCompleted")}
                            </ModalButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
