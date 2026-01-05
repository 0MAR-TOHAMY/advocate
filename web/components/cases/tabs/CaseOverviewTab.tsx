"use client";

import React from "react";
import {
    Scale,
    Gavel,
    Zap,
    Calendar,
    FileText,
    DollarSign,
    User,
    Phone,
    Mail,
    MapPin,
    Clock,
    Activity,
    Shield,
    Link as LinkIcon,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import CaseFinancialsCard from "@/components/cases/CaseFinancialsCard";
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

interface PartyInfoProps {
    name: string;
    capacity?: string;
    phone?: string;
    email?: string;
    address?: string;
    type?: string;
    t: any;
    isClient?: boolean;
}

const PartyInfo = ({ name, capacity, phone, email, address, type, t, isClient }: PartyInfoProps) => (
    <div className="space-y-4">
        <div>
            <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    {isClient ? t("client") : t("opposingParty")}
                </p>
                {type && (
                    <span className="text-[10px] font-bold text-brand-primary px-2 py-0.5 bg-brand-primary/5 rounded-md">
                        {t(`clientTypes.${type}`)}
                    </span>
                )}
            </div>
            <p className="text-base font-black text-gray-900 leading-tight">{name}</p>
            {capacity && (
                <p className="text-xs font-bold text-gray-500 mt-0.5">{capacity}</p>
            )}
        </div>

        <div className="grid grid-cols-1 gap-2">
            {phone && (
                <div className="flex items-center gap-3 text-sm group">
                    <div className="w-6 h-6 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                        <Phone className="w-2.5 h-2.5 text-gray-400 group-hover:text-brand-primary" />
                    </div>
                    <span className="text-gray-700">{phone}</span>
                </div>
            )}
            {email && (
                <div className="flex items-center gap-3 text-sm group">
                    <div className="w-6 h-6 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                        <Mail className="w-2.5 h-2.5 text-gray-400 group-hover:text-brand-primary" />
                    </div>
                    <span className="text-gray-700 truncate">{email}</span>
                </div>
            )}
            {address && (
                <div className="flex items-start gap-3 text-sm group">
                    <div className="w-6 h-6 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors shrink-0">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 group-hover:text-brand-primary" />
                    </div>
                    <span className="text-gray-700 leading-snug">{address}</span>
                </div>
            )}
        </div>
    </div>
);

interface CaseOverviewTabProps {
    caseData: any;
    locale: string;
    t: any;
    tCommon: any;
    members: any[];
    hearings?: any[];
    expenses?: any[];
    onScheduleHearing: () => void;
    onUploadDocument: () => void;
    onAddExpense: () => void;
    onTabChange: (tab: string) => void;
}

export function CaseOverviewTab({
    caseData,
    locale,
    t,
    tCommon,
    members,
    hearings = [],
    expenses = [],
    onScheduleHearing,
    onUploadDocument,
    onAddExpense,
    onTabChange
}: CaseOverviewTabProps) {
    const isRtl = locale === "ar";
    const assignedUser = members.find((m: any) => m.userId === caseData.assignedTo);

    // Calculate Next Hearing & Judge
    const futureHearings = hearings.filter((h: any) => new Date(h.hearingDate) >= new Date());
    futureHearings.sort((a: any, b: any) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());

    // If no future hearings, check for the most recent past one (optional, but requested "based on last session" could mean either next or previous?)
    // The request said "Next Hearing ... based on last session". 
    // Usually means "Next Hearing" as per schedule.
    // If "based on last session" implies showing the *result* of last session as "judge" etc, that's different.
    // But typically "Next Hearing" field should show the upcoming date.

    const nextHearingObj = futureHearings.length > 0 ? futureHearings[0] : null;

    const displayNextHearing = nextHearingObj
        ? new Date(nextHearingObj.hearingDate).toLocaleDateString(locale)
        : (caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleDateString(locale) : "-");

    // Use hearing judge or fallback to case judge
    const displayJudge = nextHearingObj?.judge || caseData.judge || "-";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-8 space-y-4">
                {/* Description Card */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-brand-primary" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("description")}</h3>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                        {caseData.description || t("noDescription")}
                    </p>
                </div>

                {/* Case Details Grid */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <Scale className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("caseInformation")}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InfoItem
                            label={t("caseType")}
                            value={caseData.caseType === "other" && caseData.customCaseType
                                ? caseData.customCaseType
                                : t(`caseTypes.${caseData.caseType}`)}
                            icon={<Activity className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("caseStage")}
                            value={caseData.caseStage === "other" && caseData.customCaseStage
                                ? caseData.customCaseStage
                                : t(`stages.${caseData.caseStage}`)}
                            icon={<Gavel className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("filingDate")}
                            value={caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString(locale) : "-"}
                            icon={<Calendar className="w-3 h-3" />}
                        />

                        {/* Clickable Hearing Info */}
                        <div onClick={() => onTabChange("hearings")} className="cursor-pointer group hover:opacity-80 transition-opacity">
                            <InfoItem
                                label={t("nextHearing")}
                                value={<span className="group-hover:text-brand-primary transition-colors flex items-center gap-2">
                                    {displayNextHearing}
                                    <LinkIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>}
                                icon={<Clock className="w-3 h-3" />}
                            />
                        </div>

                        <div onClick={() => onTabChange("hearings")} className="cursor-pointer group hover:opacity-80 transition-opacity">
                            <InfoItem
                                label={t("judge")}
                                value={<span className="group-hover:text-brand-primary transition-colors">
                                    {displayJudge}
                                </span>}
                                icon={<Scale className="w-3 h-3" />}
                            />
                        </div>

                        <InfoItem
                            label={t("claimAmount")}
                            value={caseData.claimAmount
                                ? `${caseData.claimAmount.toLocaleString(locale)} ${caseData.currency || "AED"}`
                                : "-"}
                            icon={<DollarSign className="w-3 h-3" />}
                        />
                    </div>

                    <div className="h-px bg-gray-50 my-10" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoItem
                            label={t("assignedTo")}
                            value={assignedUser?.name || caseData.assignedTo}
                            icon={<User className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={t("createdAt")}
                            value={caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString(locale) : "-"}
                        />
                        <InfoItem
                            label={t("updatedAt")}
                            value={caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString(locale) : "-"}
                        />
                        <InfoItem
                            label={isRtl ? "القضية الأصل" : "Parent Case"}
                            value={caseData.parentCaseId ? (
                                <Link href={`/${locale}/dashboard/cases/${caseData.parentCaseId}`} className="text-brand-primary hover:underline">
                                    {isRtl ? "عرض القضية" : "View Case"}
                                </Link>
                            ) : null}
                            icon={<LinkIcon className="w-3 h-3" />}
                        />
                        <InfoItem
                            label={isRtl ? "تاريخ انتهاء الوكالة" : "POA Expiry"}
                            value={caseData.poaExpiryDate ? new Date(caseData.poaExpiryDate).toLocaleDateString(locale) : "-"}
                        />
                        <InfoItem
                            label={isRtl ? "محمية بكلمة مرور" : "Protected"}
                            value={caseData.hasPassword ? tCommon("yes") : tCommon("no")}
                            isBadge
                            badgeVariant={caseData.hasPassword ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}
                            icon={<Shield className="w-3 h-3" />}
                        />
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
                            <h3 className="text-sm font-black uppercase tracking-widest">{t("quickActions")}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            <ModalButton
                                onClick={onScheduleHearing}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-white rounded-[20px] transition-all !px-3 !justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Calendar className="w-4 h-4 text-brand-primary" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("scheduleHearing")}</span>
                            </ModalButton>

                            <ModalButton
                                onClick={onUploadDocument}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-white rounded-[20px] transition-all !px-3 !justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("addDocument")}</span>
                            </ModalButton>

                            <ModalButton
                                onClick={onAddExpense}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-white rounded-[20px] transition-all !px-3 !justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <DollarSign className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("recordExpense")}</span>
                            </ModalButton>

                            <button
                                onClick={() => onTabChange("judgments")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Gavel className="w-4 h-4 text-rose-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{isRtl ? "الأحكام" : "Judgments"}</span>
                            </button>

                            <button
                                onClick={() => onTabChange("updates")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{isRtl ? "التحديثات" : "Updates"}</span>
                            </button>

                            <button
                                onClick={() => onTabChange("notes")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <MessageSquare className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{isRtl ? "الملاحظات" : "Notes"}</span>
                            </button>

                            <button
                                onClick={() => onTabChange("timeline")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Activity className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{isRtl ? "السجل" : "Timeline"}</span>
                            </button>

                            <button
                                onClick={() => onTabChange("tasks")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[20px] transition-all px-3 flex items-center justify-start gap-4 group/btn"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t("tasks")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Parties & Actions */}
            <div className="lg:col-span-4 space-y-4">
                {/* Parties Card */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t("parties")}</h3>
                    </div>

                    <div className="space-y-8">
                        <PartyInfo
                            name={caseData.clientName}
                            capacity={caseData.clientCapacity}
                            phone={caseData.clientPhone}
                            email={caseData.clientEmail}
                            address={caseData.clientAddress}
                            type={caseData.clientType}
                            t={t}
                            isClient
                        />

                        <div className="h-px bg-gray-50" />

                        <PartyInfo
                            name={caseData.opposingParty || "-"}
                            capacity={caseData.opposingPartyCapacity}
                            phone={caseData.opposingPartyPhone}
                            email={caseData.opposingPartyEmail}
                            address={caseData.opposingPartyAddress}
                            t={t}
                            isClient={false}
                        />
                    </div>
                </div>

                {/* Financial Summary */}
                <CaseFinancialsCard
                    caseId={caseData.id}
                    expenses={expenses}
                    claimAmount={caseData.claimAmount}
                    currency={caseData.currency}
                />
            </div>
        </div>
    );
}
