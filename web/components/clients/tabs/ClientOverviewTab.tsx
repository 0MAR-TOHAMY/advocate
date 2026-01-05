"use client";

import React from "react";
import {
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    Activity,
    Shield,
    Link as LinkIcon,
    Zap,
    Briefcase,
    BadgeCheck,
    AlertTriangle,
    Globe,
    Building2,
    Hash,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { cn } from "@/lib/utils";

interface InfoItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    isBadge?: boolean;
    badgeVariant?: string;
}

const InfoItem = ({ label, value, icon, className, isBadge, badgeVariant }: InfoItemProps) => (
    <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
        </div>
        {isBadge ? (
            <Badge className={cn("px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide", badgeVariant)}>
                {value || "-"}
            </Badge>
        ) : (
            <p className="text-sm font-bold text-gray-900 truncate">{value || "-"}</p>
        )}
    </div>
);

interface ClientOverviewTabProps {
    client: any;
    locale: string;
    t: any;
    tCommon: any;
    stats: {
        totalCases: number;
        activeCases: number;
        totalDocuments: number;
    };
    onAddCase: () => void;
    onUploadDocument: () => void;
    onTabChange: (tab: string) => void;
}

export function ClientOverviewTab({
    client,
    locale,
    t,
    tCommon,
    stats,
    onAddCase,
    onUploadDocument,
    onTabChange
}: ClientOverviewTabProps) {
    const isRtl = locale === "ar";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-8 space-y-4">
                {/* Contact & Address Grid */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("contactInformation")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <InfoItem
                                label={t("phone")}
                                value={client.phone}
                                icon={<Phone className="w-3 h-3" />}
                            />
                            <InfoItem
                                label={t("email")}
                                value={client.email}
                                icon={<Mail className="w-3 h-3" />}
                            />
                        </div>
                        <div className="space-y-6">
                            <InfoItem
                                label={t("address")}
                                value={client.address}
                                icon={<MapPin className="w-3 h-3" />}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem
                                    label={t("city")}
                                    value={client.city}
                                />
                                <InfoItem
                                    label={t("country")}
                                    value={client.country}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC & Identity Card */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("kycDocuments")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <InfoItem
                            label={t("nationalId")}
                            value={client.nationalId}
                            icon={<Hash className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("passportNumber")}
                            value={client.passportNumber}
                            icon={<Shield className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("tradeLicenseNumber")}
                            value={client.tradeLicenseNumber}
                            icon={<Building2 className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("taxNumber")}
                            value={client.taxNumber}
                            icon={<Hash className="w-3 h-3" />}
                        />
                    </div>

                    <div className="h-px bg-gray-50 my-10" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InfoItem
                            label={t("verificationStatus")}
                            value={t(`verificationStatuses.${client.verificationStatus}`)}
                            isBadge
                            badgeVariant={
                                client.verificationStatus === "verified" ? "!bg-emerald-100 !text-emerald-700" :
                                    client.verificationStatus === "rejected" ? "!bg-rose-100 !text-rose-700" :
                                        "!bg-amber-100 !text-amber-700"
                            }
                        />
                        <InfoItem
                            label={t("riskLevel")}
                            value={t(`riskLevels.${client.riskLevel}`)}
                            isBadge
                            badgeVariant={
                                client.riskLevel === "low" ? "!bg-emerald-100 !text-emerald-700" :
                                    client.riskLevel === "high" ? "!bg-rose-100 !text-rose-700" :
                                        "!bg-amber-100 !text-amber-700"
                            }
                        />
                        <InfoItem
                            label={t("createdAt")}
                            value={client.createdAt ? new Date(client.createdAt).toLocaleDateString(locale) : "-"}
                            icon={<Calendar className="w-3 h-3" />}
                        />
                    </div>

                    {client.kycNotes && (
                        <div className="mt-8 pt-8 border-t border-gray-50">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-3 h-3 text-gray-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("kycNotes")}</h4>
                            </div>
                            <p className="text-gray-600 text-[13px] leading-relaxed font-medium whitespace-pre-wrap bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                {client.kycNotes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Notes/Description Card */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-brand-primary" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("notes")}</h3>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                        {client.notes || tCommon("noData")}
                    </p>
                    {client.specialNotes && (
                        <div className="mt-6 pt-6 border-t border-gray-50">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("specialNotes")}</h4>
                            <p className="text-gray-600 text-[14px] leading-relaxed italic whitespace-pre-wrap">
                                &quot;{client.specialNotes}&quot;
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Right Column - Stats & Summary */}
            <div className="lg:col-span-4 space-y-4">
                {/* Stats Card */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{isRtl ? "إحصائيات" : "Statistics"}</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("cases")}</p>
                                    <p className="text-xl font-black text-gray-900">{stats.totalCases}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{isRtl ? "نشط" : "Active"}</p>
                                <p className="text-sm font-bold text-gray-900">{stats.activeCases}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("documents")}</p>
                                    <p className="text-xl font-black text-gray-900">{stats.totalDocuments}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-[24px] bg-linear-to-br from-brand-primary/5 to-transparent border border-brand-primary/10">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-brand-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-1">{isRtl ? "مستوى المخاطر" : "Risk Profile"}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                        {isRtl ? "تم تقييم هذا العميل بمستوى مخاطر:" : "This client has been assessed with risk level:"}
                                        <span className="font-bold text-gray-900 mx-1">
                                            {t(`riskLevels.${client.riskLevel}`)}
                                        </span>
                                    </p>
                                    <Badge className={cn(
                                        "font-black uppercase text-[10px] tracking-widest px-3 py-1",
                                        client.riskLevel === "low" ? "!bg-emerald-100 !text-emerald-700 hover:bg-emerald-200" :
                                            client.riskLevel === "high" ? "!bg-rose-100 !text-rose-700 hover:bg-rose-200" :
                                                "!bg-amber-100 !text-amber-700 hover:bg-amber-200"
                                    )}>
                                        {t(`riskLevels.${client.riskLevel}`)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-[25px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest">{tCommon("actions")}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-2">
                            <ModalButton
                                onClick={onAddCase}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-white rounded-[20px] transition-all !px-3 !justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Briefcase className="w-4 h-4 text-brand-primary" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{isRtl ? "قضية جديدة" : "New Case"}</span>
                            </ModalButton>

                            <ModalButton
                                onClick={onUploadDocument}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-white rounded-[20px] transition-all !px-3 !justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("newDocument")}</span>
                            </ModalButton>

                            <button
                                onClick={() => onTabChange("cases")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Briefcase className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("cases")}</span>
                            </button>

                            <button
                                onClick={() => onTabChange("documents")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("documents")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
