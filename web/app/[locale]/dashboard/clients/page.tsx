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
    Users,
    UserCheck,
    UserMinus,
    TrendingUp,
    Eye,
    Mail,
    Phone,
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

type Client = {
    id: string;
    clientNumber: string;
    name: string;
    clientType: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    status: string;
    createdAt: string;
};

type ClientStats = {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    newThisMonth: number;
};

export default function ClientsPage() {
    const t = useTranslations("clients");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const isRtl = locale === "ar";
    const { user } = useAuth();

    const canCreate = user?.role === 'admin' || user?.role === 'owner' || user?.permissions?.includes(Permissions.CLIENTS_CREATE);

    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchClients();
        fetchStats();
    }, [statusFilter, typeFilter, searchQuery, page, pageSize, sort, order]);

    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (typeFilter !== "all") params.append("clientType", typeFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("page", String(page));
            params.append("pageSize", String(pageSize));
            params.append("sort", sort);
            params.append("order", order);

            const response = await fetch(`/api/clients?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setClients(data.items || data);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/clients/statistics");
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
            case "active":
                variantStyle = "bg-emerald-50 text-emerald-600";
                break;
            case "inactive":
                variantStyle = "bg-gray-100 text-gray-600";
                break;
            case "blocked":
                variantStyle = "bg-red-50 text-red-600";
                break;
        }

        return (
            <Badge variant="outline" className={cn("text-xs py-1 border-0 font-medium", variantStyle)}>
                {t(`statuses.${status}`)}
            </Badge>
        );
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case "individual":
                return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
            case "company":
                return "bg-teal-50 text-teal-700 border-teal-100";
            case "government":
                return "bg-purple-50 text-purple-700 border-purple-100";
            case "organization":
                return "bg-pink-50 text-pink-700 border-pink-100";
            default:
                return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    const statCards = [
        { label: t("totalClients"), count: stats?.totalClients || 0, icon: Users, color: "bg-blue-500/10 text-blue-500" },
        { label: t("activeClients"), count: stats?.activeClients || 0, icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
        { label: t("inactiveClients"), count: stats?.inactiveClients || 0, icon: UserMinus, color: "bg-orange-50 text-orange-600" },
        { label: t("newThisMonth"), count: stats?.newThisMonth || 0, icon: TrendingUp, color: "bg-gray-50 text-gray-600" },
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
                    <Link href={`/${locale}/dashboard/clients/new`}>
                        <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {t("addNewClient")}
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
                        <div className="flex gap-4">
                            <div className="w-48">
                                <Select
                                    value={typeFilter}
                                    onChange={(v) => { setTypeFilter(v); setPage(1); }}
                                    options={[
                                        { value: "all", label: t("allTypes") },
                                        { value: "individual", label: t("clientTypes.individual") },
                                        { value: "company", label: t("clientTypes.company") },
                                        { value: "government", label: t("clientTypes.government") },
                                        { value: "organization", label: t("clientTypes.organization") },
                                    ]}
                                />
                            </div>
                            <div className="w-40">
                                <Select
                                    value={statusFilter}
                                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                    options={[
                                        { value: "all", label: t("allStatuses") },
                                        { value: "active", label: t("statuses.active") },
                                        { value: "inactive", label: t("statuses.inactive") },
                                        { value: "blocked", label: t("statuses.blocked") },
                                    ]}
                                />
                            </div>
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
                ) : clients && clients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("clientNumber"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("clientNumber")}</th>
                                    <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("name"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("name")}</th>
                                    <th className="text-start px-4 py-3">{t("clientType")}</th>
                                    <th className="text-start px-4 py-3">{t("contactInformation")}</th>
                                    <th className="text-start px-4 py-3">{t("status")}</th>
                                    <th className="text-center px-4 py-3">{tCommon("view")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {clients.map((client) => (
                                    <tr key={client.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 text-[13px] font-bold text-gray-500">{client.clientNumber}</td>
                                        <td className="px-4 py-4 font-bold text-[14px] text-gray-900">{client.name}</td>
                                        <td className="px-4 py-4">
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border", getTypeStyle(client.clientType))}>
                                                {t(`clientTypes.${client.clientType}`)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                {client.phone && (
                                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                                                        <Phone className="h-3 w-3 text-brand-primary" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                )}
                                                {client.email && (
                                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                                                        <Mail className="h-3 w-3 text-brand-primary" />
                                                        <span>{client.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">{getStatusBadge(client.status)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <Link href={`/${locale}/dashboard/clients/${client.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-block" title={t("view")}>
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
                        icon={<Users className="h-12 w-12 text-gray-400" />}
                        title={t("noClients")}
                        description={t("noClientsMessage")}
                        action={
                            canCreate ? (
                                <Link href={`/${locale}/dashboard/clients/new`}>
                                    <Button className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        {t("addNewClient")}
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                )}

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="text-[13px] font-medium text-gray-400">
                        {tCommon("showing")} <span className="text-gray-900">{clients.length}</span> {tCommon("of")} <span className="text-gray-900">{total}</span>
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
                            disabled={clients.length < pageSize}
                        >
                            {isRtl ? "التالي" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
