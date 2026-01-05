/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Plus,
    Search,
    Briefcase,
    Clock,
    CheckCircle2,
    TrendingUp,
    Eye,
    DollarSign,
    Calendar,
    Activity,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import ModalButton from "@/components/ui/ModalButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Permissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type GeneralWork = {
    id: string;
    workNumber: string;
    title: string;
    clientName: string;
    workType: string;
    status: string;
    priority: string;
    fee: number;
    paidAmount: number;
    paymentStatus: string;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
};

type WorkStats = {
    totalWork: number;
    pendingWork: number;
    inProgressWork: number;
    completedThisMonth: number;
};

export default function GeneralWorkPage() {
    const t = useTranslations("generalWork");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const isRtl = locale === "ar";
    const { user } = useAuth();

    const canCreate = user?.role === 'admin' || user?.role === 'owner' || user?.permissions?.includes(Permissions.GENERAL_WORK_CREATE);

    const [workItems, setWorkItems] = useState<GeneralWork[]>([]);
    const [stats, setStats] = useState<WorkStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchWork();
        fetchStats();
    }, [statusFilter, searchQuery, page, pageSize, sort, order]);

    const fetchWork = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("page", String(page));
            params.append("pageSize", String(pageSize));
            params.append("sort", sort);
            params.append("order", order);

            const response = await fetch(`/api/general-work?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setWorkItems(data.items || data);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching general work:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/general-work/statistics");
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        let variantStyle = "bg-gray-100 text-gray-500";
        switch (status) {
            case "pending":
                variantStyle = "bg-orange-50 text-orange-600";
                break;
            case "in_progress":
                variantStyle = "bg-blue-50 text-blue-600";
                break;
            case "completed":
                variantStyle = "bg-emerald-50 text-emerald-600";
                break;
            case "cancelled":
                variantStyle = "bg-red-50 text-red-600";
                break;
        }

        return (
            <Badge variant="outline" className={cn("text-xs py-1 border-0 font-medium", variantStyle)}>
                {t(`statuses.${status}`)}
            </Badge>
        );
    };

    const statCards = [
        { label: t("totalWork"), count: stats?.totalWork || 0, icon: Briefcase, color: "bg-blue-500/10 text-blue-500" },
        { label: t("pendingWork"), count: stats?.pendingWork || 0, icon: Clock, color: "bg-orange-50 text-orange-600" },
        { label: t("inProgressWork"), count: stats?.inProgressWork || 0, icon: Activity, color: "bg-blue-50 text-blue-600" },
        { label: t("completedThisMonth"), count: stats?.completedThisMonth || 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">{t("title")}</h1>
                    <p className="text-gray-500 text-[14px]">{t("subtitle")}</p>
                </div>
                {canCreate && (
                    <Link href={`/${locale}/dashboard/general-work/new`}>
                        <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {t("addWork")}
                        </Button>
                    </Link>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-[15px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.count}</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px]">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className={cn("h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400", isRtl ? "pr-10" : "pl-10")}
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <Select
                                value={statusFilter}
                                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                options={[
                                    { value: "all", label: t("allStatuses") },
                                    { value: "pending", label: t("statuses.pending") },
                                    { value: "in_progress", label: t("statuses.in_progress") },
                                    { value: "completed", label: t("statuses.completed") },
                                    { value: "cancelled", label: t("statuses.cancelled") },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader />
                    </div>
                ) : workItems && workItems.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("workNumber"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("workNumber")}</th>
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("title"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("workTitle")}</th>
                                    <th className="text-start px-4 py-3">{t("client")}</th>
                                    <th className="text-start px-4 py-3">{t("status")}</th>
                                    <th className="text-center px-4 py-3">{tCommon("view")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {workItems.map((work) => (
                                    <tr key={work.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 text-[13px] font-bold text-gray-500">{work.workNumber}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold text-gray-900 uppercase tracking-tight">{work.title}</span>
                                                <span className="text-[11px] text-gray-400 font-medium uppercase">{t(`workTypes.${work.workType}`)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-bold text-[14px] text-gray-700">{work.clientName}</td>
                                        <td className="px-4 py-4">{getStatusBadge(work.status)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <Link href={`/${locale}/dashboard/general-work/${work.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-block" title={t("view")}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon={<Briefcase className="h-12 w-12 text-gray-400" />}
                        title={t("noWork")}
                        description={t("noWorkMessage")}
                        action={
                            canCreate ? (
                                <Link href={`/${locale}/dashboard/general-work/new`}>
                                    <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        {t("addWork")}
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                )}

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="text-[13px] font-medium text-gray-400">
                        {tCommon("showing")} <span className="text-gray-900">{workItems.length}</span> {tCommon("of")} <span className="text-gray-900">{total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="h-9 px-4 rounded-lg border border-gray-100 text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            {isRtl ? "السابق" : "Previous"}
                        </button>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary text-[12px] font-black">
                            {page}
                        </div>
                        <button
                            className="h-9 px-4 rounded-lg border border-gray-100 text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onClick={() => setPage(page + 1)}
                            disabled={workItems.length < pageSize}
                        >
                            {isRtl ? "التالي" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
