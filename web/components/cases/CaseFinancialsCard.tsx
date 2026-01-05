"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
    TrendingUp, TrendingDown, Wallet, DollarSign,
    Receipt, BarChart3, AlertCircle, Info, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface FinancialsData {
    groupId: string | null;
    isGroup: boolean;
    totalClaim: number;
    totalCollected: number;
    totalExpenses: number;
    currency: string;
    caseCount: number;
}

interface CaseFinancialsCardProps {
    caseId: string;
    expenses?: any[];
    claimAmount?: number;
    currency?: string;
}

export default function CaseFinancialsCard({ caseId, expenses, claimAmount, currency }: CaseFinancialsCardProps) {
    const t = useTranslations("cases");
    const params = useParams();
    const locale = (params?.locale as string) || "ar";
    const isRtl = locale === "ar";

    const [data, setData] = useState<FinancialsData | null>(null);
    const [loading, setLoading] = useState(!expenses);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (expenses) {
            // Calculate from props
            const totalE = expenses.filter(e => e.category === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const totalC = expenses.filter(e => e.category === 'collection').reduce((sum, item) => sum + Number(item.amount || 0), 0);

            setData({
                groupId: null,
                isGroup: false,
                totalClaim: claimAmount || 0,
                totalCollected: totalC,
                totalExpenses: totalE,
                currency: currency || "AED",
                caseCount: 1
            });
            setLoading(false);
            return;
        }

        async function fetchFinancials() {
            try {
                const res = await fetch(`/api/cases/${caseId}/group-financials`);
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchFinancials();
    }, [caseId, expenses, claimAmount, currency]);

    if (loading) {
        return (
            <Card className="p-6 h-[280px] flex flex-col justify-between !shadow-none !rounded-[25px] !border-none">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-20 w-full rounded-2xl" />
            </Card>
        );
    }

    if (error || !data) return null;

    const netPosition = data.totalCollected - data.totalExpenses;
    const isProfit = netPosition >= 0;

    const progressPercent = data.totalClaim > 0
        ? Math.min(Math.round((data.totalCollected / data.totalClaim) * 100), 100)
        : 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
            style: "currency",
            currency: data.currency || "AED",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <Card className="p-0 overflow-hidden border-none rounded-[25px] group !shadow-none">
            {/* Header with Title & Badge */}
            <div className="p-6 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-primary" />
                        <h3 className="text-white font-extrabold text-[16px] tracking-tight">
                            {data.isGroup ? t("financials.groupSummary") : t("financialInfo")}
                        </h3>
                    </div>
                    {data.isGroup && (
                        <div className="px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center gap-1.5 transition-all group-hover:bg-brand-primary group-hover:text-white duration-500">
                            <Layers className="w-3 h-3 transition-transform group-hover:rotate-12" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t("financials.group")} ({data.caseCount})</span>
                        </div>
                    )}
                </div>
                <p className="text-gray-400 text-[11px] font-medium leading-relaxed">
                    {isRtl
                        ? "نظرة متكاملة على الوضع المالي المجمع للمطالبات والتحصيلات والمصروفات."
                        : "Integrated overview of the consolidated financial position of claims, collections, and expenses."
                    }
                </p>
            </div>

            <div className="p-6 space-y-6 bg-white relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                {/* Top Row: Claims & Collected */}
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 rounded-[22px] bg-gray-50 border border-gray-100/50 hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{t("claimAmount")}</span>
                        </div>
                        <p className="text-[18px] font-black text-gray-900 tracking-tight">{formatCurrency(data.totalClaim)}</p>
                    </div>

                    <div className="p-4 rounded-[22px] bg-emerald-50/30 border border-emerald-100/50 hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">{t("collectedAmount")}</span>
                        </div>
                        <p className="text-[18px] font-black text-emerald-700 tracking-tight">{formatCurrency(data.totalCollected)}</p>
                    </div>
                </div>

                {/* Expenses Row */}
                <div className="p-4 rounded-[22px] bg-red-50/30 border border-red-100/50 relative z-10 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm shadow-red-200">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-red-600 leading-none mb-1">{t("financials.totalExpenses")}</p>
                            <p className="text-sm text-gray-500 font-bold">{data.isGroup ? t("financials.groupSummary") : t("expenses")}</p>
                        </div>
                    </div>
                    <p className="text-[20px] font-black text-red-700 tracking-tighter">-{formatCurrency(data.totalExpenses)}</p>
                </div>

                {/* Net Position (Large Card) */}
                <div className={cn(
                    "p-6 rounded-[28px] border relative z-10 transition-all duration-700 overflow-hidden group/net",
                    isProfit
                        ? "bg-linear-to-br from-gray-900 to-gray-800 border-white/10 shadow-lg shadow-gray-200"
                        : "bg-linear-to-br from-red-600 to-red-700 border-red-500 shadow-lg shadow-red-100"
                )}>
                    {/* Animated Background Pattern for the position card */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl -mr-24 -mt-24 animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between relative z-10 mb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">
                                    {t("financials.netPosition")}
                                </span>
                                {isProfit ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-400 animate-bounce" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 text-red-300 animate-bounce" />
                                )}
                            </div>
                            <p className="text-[32px] font-black text-white tracking-tighter leading-none transition-transform group-hover/net:scale-105 duration-500">
                                {formatCurrency(netPosition)}
                            </p>
                        </div>

                        <div className={cn(
                            "px-4 py-2 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-500",
                            isProfit ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-white text-red-600"
                        )}>
                            {isProfit ? t("financials.profit") : t("financials.loss")}
                        </div>
                    </div>

                    {/* Progress Bar for Collected / Claim */}
                    <div className="relative z-10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
                            <span>{t("collectedAmount")} {progressPercent}%</span>
                            <span>{t("claimAmount")}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-gray-400 px-2 group-hover:text-gray-500 transition-colors">
                    <Info className="w-3 h-3" />
                    <span>
                        {isRtl
                            ? "يتم تحديث هذه البيانات تلقائياً عند تسجيل مبالغ تحصيل أو مصروفات جديدة."
                            : "Data updates automatically upon recording new collections or expenses."
                        }
                    </span>
                </div>
            </div>
        </Card>
    );
}
