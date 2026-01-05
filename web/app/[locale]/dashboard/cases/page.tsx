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
    Lock,
    Scale,
    CheckCircle2,
    FileText,
    Archive,
    Eye,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import Select from "@/components/ui/Select";
import ModalButton from "@/components/ui/ModalButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { Permissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type Case = {
    id: string;
    caseNumber: string | null;
    caseYear: number;
    title: string;
    clientName: string;
    clientCapacity: string | null;
    court: string | null;
    caseType: string;
    customCaseType: string | null;
    status: string;
    assignedTo: string | null;
    hasPassword: boolean;
    internalReferenceNumber: string | null;
};

type CaseStats = {
    totalCases: number;
    activeCases: number;
    decidedCases: number;
    closedCases: number;
};

export default function CasesPage() {
    const t = useTranslations("cases");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const isRtl = locale === "ar";
    const { user } = useAuth();
    const canCreate = user?.role === 'admin' || user?.role === 'owner' || user?.permissions?.includes(Permissions.CASES_CREATE);

    const [cases, setCases] = useState<Case[]>([]);
    const [stats, setStats] = useState<CaseStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchCases();
        fetchStats();
    }, [statusFilter, searchQuery, page, pageSize, sort, order]);

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("page", String(page));
            params.append("pageSize", String(pageSize));
            params.append("sort", sort);
            params.append("order", order);

            const response = await fetch(`/api/cases?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setCases(data.items || data);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/cases/statistics");
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching case statistics:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        let variantStyle = "bg-gray-100 text-gray-600";
        switch (status) {
            case "active":
                variantStyle = "bg-brand-primary/10 text-brand-primary";
                break;
            case "decided":
                variantStyle = "bg-emerald-50 text-emerald-600";
                break;
            case "pending":
                variantStyle = "bg-orange-50 text-orange-600";
                break;
            case "closed":
            case "archived":
                variantStyle = "bg-gray-50 text-gray-500";
                break;
        }

        return (
            <Badge variant="outline" className={cn("text-xs py-1 border-0 font-medium", variantStyle)}>
                {t(`statuses.${status}`)}
            </Badge>
        );
    };

    const statCards = [
        { label: t("stats.total"), count: stats?.totalCases || 0, icon: FileText, color: "bg-blue-500/10 text-blue-500" },
        { label: t("stats.active"), count: stats?.activeCases || 0, icon: Scale, color: "bg-emerald-50 text-emerald-600" },
        { label: t("stats.decided"), count: stats?.decidedCases || 0, icon: CheckCircle2, color: "bg-orange-50 text-orange-600" },
        { label: t("stats.closed"), count: stats?.closedCases || 0, icon: Archive, color: "bg-gray-50 text-gray-600" },
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
                    <Link href={`/${locale}/dashboard/cases/new`}>
                        <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {t("newCase")}
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

            {/* Search & Filter */}
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
                                    { value: "active", label: t("statuses.active") },
                                    { value: "pending", label: t("statuses.pending") },
                                    { value: "closed", label: t("statuses.closed") },
                                    { value: "archived", label: t("statuses.archived") },
                                    { value: "decided", label: t("statuses.decided") },
                                    { value: "suspended", label: t("statuses.suspended") },
                                    { value: "canceled", label: t("statuses.canceled") },
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
                ) : cases && cases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("internalReferenceNumber"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("internalReference")}</th>
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("caseNumber"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("caseNumber")}</th>
                                    <th className="text-start px-4 py-3">{t("clientName")}</th>
                                    <th className="text-start px-4 py-3">{t("caseType")}</th>
                                    <th className="text-start px-4 py-3">{t("status")}</th>
                                    <th className="text-center px-4 py-3">{tCommon("view")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cases.map((caseItem) => (
                                    <tr key={caseItem.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {caseItem.hasPassword && <Lock className="h-3 w-3 text-amber-500" />}
                                                <span className="text-[13px] font-bold text-gray-900">{caseItem.internalReferenceNumber || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[14px] font-bold text-gray-700">{caseItem.caseNumber || "-"}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold text-gray-900">{caseItem.hasPassword ? "▨▨▨▨▨▨" : caseItem.clientName}</span>
                                                <span className="text-[12px] text-gray-500 font-medium">{caseItem.hasPassword ? "▨▨▨" : (caseItem.clientCapacity || "-")}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border bg-gray-50 border-gray-100 text-gray-600">
                                                {caseItem.hasPassword ? "▨▨▨" : (caseItem.caseType === "other" && caseItem.customCaseType
                                                    ? caseItem.customCaseType
                                                    : t(`caseTypes.${caseItem.caseType}`))}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {caseItem.hasPassword ? (
                                                <Badge variant="outline" className="text-xs py-1 border-0 bg-gray-50 text-gray-400 font-medium">{t("passwordProtected")}</Badge>
                                            ) : (
                                                getStatusBadge(caseItem.status)
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Link href={`/${locale}/dashboard/cases/${caseItem.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-block" title={t("viewCase")}>
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
                        title={t("noCases")}
                        description={searchQuery || statusFilter !== "all" ? t("noCases") : t("noCasesMessage")}
                        action={canCreate && !searchQuery && statusFilter === "all" ? (
                            <Link href={`/${locale}/dashboard/cases/new`}>
                                <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    {t("newCase")}
                                </Button>
                            </Link>
                        ) : undefined}
                    />
                )}

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="text-[13px] font-medium text-gray-400">
                        {tCommon("showing")} <span className="text-gray-900">{cases.length}</span> {tCommon("of")} <span className="text-gray-900">{total}</span>
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
                            disabled={cases.length < pageSize}
                        >
                            {isRtl ? "التالي" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
