"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    BarChart3,
    TrendingUp,
    Users,
    Briefcase,
    DollarSign,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    FilePieChart,
    Layers,
    Activity
} from "lucide-react";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

type SummaryStats = {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    decidedCases: number;
    totalClients: number;
    totalClaimAmount: number;
    totalCollectedAmount: number;
};

type FinancialStats = {
    currency: string | null;
    status: string;
    count: number;
    totalClaim: number;
    totalCollected: number;
};

type WorkloadStats = {
    userId: string | null;
    userName: string | null;
    caseCount: number;
};

export default function ReportsPage() {
    const t = useTranslations("reports");
    const tCommon = useTranslations("common");
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [financials, setFinancials] = useState<FinancialStats[]>([]);
    const [workload, setWorkload] = useState<WorkloadStats[]>([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [reportType, setReportType] = useState("summary");

    useEffect(() => {
        fetchData();
    }, [reportType]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sumRes, finRes, workRes] = await Promise.all([
                fetch("/api/reports?type=summary"),
                fetch("/api/reports?type=financials"),
                fetch("/api/reports?type=workload")
            ]);

            if (sumRes.ok) setSummary(await sumRes.json());
            if (finRes.ok) {
                const finData = await finRes.json();
                setFinancials(finData.financialStats);
                setTotalExpenses(finData.totalExpenses);
            }
            if (workRes.ok) setWorkload(await workRes.json());
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = "AED") => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 mt-1">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="flex items-center gap-2 border-gray-200">
                        <Download className="h-4 w-4" />
                        {t("export")}
                    </Button>
                    <Button className="flex items-center gap-2 bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                        <Calendar className="h-4 w-4" />
                        {t("selectRange")}
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t("activeCases")}
                    value={summary?.activeCases || 0}
                    icon={Briefcase}
                    color="blue"
                    trend="+12%"
                    isUp={true}
                />
                <StatCard
                    title={t("totalClients")}
                    value={summary?.totalClients || 0}
                    icon={Users}
                    color="indigo"
                    trend="+5%"
                    isUp={true}
                />
                <StatCard
                    title={t("collectionRate")}
                    value={summary?.totalClaimAmount ? Math.round((summary.totalCollectedAmount / summary.totalClaimAmount) * 100) : 0}
                    suffix="%"
                    icon={TrendingUp}
                    color="green"
                    trend="+2.4%"
                    isUp={true}
                />
                <StatCard
                    title={t("decidedCases")}
                    value={summary?.decidedCases || 0}
                    icon={Activity}
                    color="orange"
                    trend="+8%"
                    isUp={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[30px] border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{t("financialPerformance")}</h3>
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs">
                                {t("realTimeData")}
                            </Badge>
                        </div>

                        <div className="space-y-6">
                            {financials.length > 0 ? financials.map((fin, idx) => (
                                <div key={idx} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-gray-900">{fin.currency || "AED"}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase">{t(`caseStatus.${fin.status}`)}</Badge>
                                        </div>
                                        <span className="text-sm text-gray-400">{fin.count} {t("cases")}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t("totalClaims")}</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(fin.totalClaim, fin.currency || "AED")}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t("totalCollected")}</p>
                                            <p className="text-2xl font-black text-brand-primary">{formatCurrency(fin.totalCollected, fin.currency || "AED")}</p>
                                        </div>
                                    </div>
                                    {/* Simplistic Progress Bar */}
                                    <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary"
                                            style={{ width: `${(fin.totalCollected / fin.totalClaim) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-gray-400">
                                    <FilePieChart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>{t("noFinancialData")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Workload */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[30px] border border-gray-100 p-8 shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                                <Layers className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{t("teamWorkload")}</h3>
                        </div>

                        <div className="space-y-5">
                            {workload.map((user, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 transition-all hover:bg-indigo-50/10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                                            {user.userName?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{user.userName || t("unassigned")}</p>
                                            <p className="text-xs text-gray-500">{user.caseCount} {t("activeCasesCount")}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, suffix = "", icon: Icon, color, trend, isUp }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-indigo-50 text-indigo-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600"
    };

    return (
        <div className="bg-white rounded-[25px] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{title}</p>
            <h4 className="text-3xl font-black text-gray-900 mt-1">
                {value}{suffix}
            </h4>
        </div>
    );
}
