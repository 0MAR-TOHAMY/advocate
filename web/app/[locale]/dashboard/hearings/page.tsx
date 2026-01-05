/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PostponeHearingDialog from "@/components/hearings/PostponeHearingDialog";
import HearingEditModal from "@/components/hearings/HearingEditModal";
import { Badge } from "@/components/ui/Badge";
import ScheduleHearingDialog from "@/components/hearings/ScheduleHearingDialog";
import AlertModal from "@/components/ui/AlertModal";
import {
  ArrowLeft, ArrowRight, Clock, Eye, Pencil, Trash,
  Search, Calendar, User, Briefcase, Plus,
  Gavel, CheckCircle2, AlertCircle, History, CalendarDays
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ModalButton from "@/components/ui/ModalButton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export default function HearingsPage() {
  const t = useTranslations("hearings");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, postponed: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState("hearingDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);

  // Dialogs
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return d;
    }
  };

  const fetchHearings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("page", String(page));
      queryParams.append("pageSize", String(pageSize));
      queryParams.append("sort", sort);
      queryParams.append("order", order);
      if (search) queryParams.append("search", search);
      if (typeFilter !== "all") queryParams.append("type", typeFilter);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);

      const res = await fetch(`/api/hearings?${queryParams.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || { total: 0, upcoming: 0, past: 0, postponed: 0 });
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/hearings/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchHearings();
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, [page, pageSize, sort, order, search, typeFilter, statusFilter]);

  const getStatusBadge = (h: any) => {
    const now = new Date();
    const hearingDate = new Date(h.hearingDate);

    if (h.isPostponed) {
      return (
        <Badge variant="outline" className="text-xs py-1 border-0 bg-yellow-50 text-yellow-600 font-medium">
          {isRtl ? "مؤجلة" : "Postponed"}
        </Badge>
      );
    }
    if (hearingDate < now) {
      return (
        <Badge variant="outline" className="text-xs py-1 border-0 bg-gray-100 text-gray-600 font-medium">
          {isRtl ? "منتهية" : "Past"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs py-1 border-0 bg-green-50 text-green-600 font-medium">
        {isRtl ? "قادمة" : "Upcoming"}
      </Badge>
    );
  };

  const statCards = [
    { label: t("stats.total"), count: stats.total, icon: CalendarDays, color: "bg-blue-500/10 text-blue-500" },
    { label: t("stats.upcoming"), count: stats.upcoming, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
    { label: t("stats.postponed"), count: stats.postponed, icon: AlertCircle, color: "bg-orange-50 text-orange-600" },
    { label: t("stats.past"), count: stats.past, icon: History, color: "bg-gray-50 text-gray-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header - Matched with Reminders */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 text-[14px]">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)} className="!px-6 !py-2 !text-[14px] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("schedule")}
        </Button>
      </div>

      {/* Stats Cards - Matched with Reminders layout & shadows */}
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

      {/* Search & Filters - Matched with Reminders */}
      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px]">
        <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-3" : "left-3")} />
            <Input
              placeholder={isRtl ? "بحث برقم القضية، العنوان أو اسم العميل..." : "Search by case number, title or client..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={cn("h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400", isRtl ? "pr-10" : "pl-10")}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
              options={[
                { value: "all", label: isRtl ? "جميع الأنواع" : "All Types" },
                { value: "offline", label: t("types.offline") },
                { value: "online", label: t("types.online") },
              ]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: "all", label: isRtl ? "جميع الجلسات" : "All Hearings" },
                { value: "upcoming", label: isRtl ? "قادمة" : "Upcoming" },
                { value: "past", label: isRtl ? "منتهية" : "Past" },
                { value: "postponed", label: isRtl ? "مؤجلة" : "Postponed" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Content Section - Matched with Reminders (Loader & Empty State Padding) */}
      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-[14px]">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("hearingNumber"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("columns.number")}</th>
                  <th className="text-start px-4 py-3">{isRtl ? "القضية / العميل" : "Case / Client"}</th>
                  <th className="text-start px-4 py-3 cursor-pointer" onClick={() => { setSort("hearingDate"); setOrder(order === "asc" ? "desc" : "asc"); }}>{t("columns.date")}</th>
                  <th className="text-start px-4 py-3">{isRtl ? "النوع" : "Type"}</th>
                  <th className="text-start px-4 py-3">{isRtl ? "الحالة" : "Status"}</th>
                  <th className="text-center px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((h) => (
                  <tr key={h.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-[13px] font-bold text-gray-900">#H{h.hearingNumber}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <Link href={`/${locale}/dashboard/cases/${h.caseId}`} className="text-[14px] font-bold text-gray-900 hover:text-blue-600 transition-colors truncate">
                          {h.caseTitle || h.caseNumber || "-"}
                        </Link>
                        <span className="text-[12px] text-gray-500 font-medium">{h.clientName || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-gray-700" dir="ltr">{formatDate(h.hearingDate)}</td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border",
                        h.hearingType === "online"
                          ? "bg-blue-50 border-blue-100 text-blue-600"
                          : "bg-indigo-50 border-indigo-100 text-indigo-600"
                      )}>
                        {t(`types.${h.hearingType}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(h)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/${locale}/dashboard/hearings/${h.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={t("view")}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" onClick={() => { setSelectedId(h.id); setEditOpen(true); }} title={tCommon("edit")}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" onClick={() => { setSelectedId(h.id); setPostponeOpen(true); }} title={t("postponeTitle")}>
                          <Clock className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => setDeleteId(h.id)} title={tCommon("delete")}>
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restore Old Pagination Style - Simple and matched */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="text-[13px] font-medium text-gray-400">
            {tCommon("showing")} <span className="text-gray-900">{items.length}</span> {tCommon("of")} <span className="text-gray-900">{total}</span>
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
              disabled={items.length < pageSize}
            >
              {isRtl ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      </div>

      <PostponeHearingDialog open={postponeOpen} onClose={() => setPostponeOpen(false)} onPostponed={fetchHearings} hearing={items.find(h => h.id === selectedId)} />
      <HearingEditModal open={editOpen} onClose={() => setEditOpen(false)} hearingId={selectedId} onSaved={fetchHearings} />
      <ScheduleHearingDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} onScheduled={fetchHearings} />

      <AlertModal
        isOpen={!!deleteId}
        type="warning"
        title={tCommon("delete")}
        message={t("confirmDelete")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmText={isDeleting ? tCommon("loading") : tCommon("delete")}
        cancelText={tCommon("cancel")}
      />
    </div>
  );
}
