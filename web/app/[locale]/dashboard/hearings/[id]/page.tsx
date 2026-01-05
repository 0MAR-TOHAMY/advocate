/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import HearingEditModal from "@/components/hearings/HearingEditModal";
import PostponeHearingDialog from "@/components/hearings/PostponeHearingDialog";
import {
  ArrowLeft, ArrowRight, Calendar, Clock, User, Briefcase, Building,
  FileText, MessageSquare, Eye, Pencil, Download, Upload, Trash,
  AlertCircle, CheckCircle, XCircle, Gavel, LayoutGrid, Info, ShieldCheck,
  Activity, MapPin, Scale
} from "lucide-react";
import HearingAttachmentsCard from "@/components/hearings/HearingAttachmentsCard";
import { HearingDetailHeader } from "@/components/hearings/HearingDetailHeader";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { TabsContent } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

export default function HearingDetailPage() {
  const t = useTranslations("hearings");
  const tCommon = useTranslations("common");
  const tCases = useTranslations("cases");
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRtl = locale === "ar";
  const id = (params as any)?.id as string;

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchHearing = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hearings/${id}`);
      const data = await res.json();
      setItem(data.hearing || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearing();
  }, [id]);

  const formatDate = (d: string) => new Date(d).toLocaleString(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const formatTime = (d: string) => new Date(d).toLocaleTimeString(locale, {
    hour: "2-digit", minute: "2-digit"
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-[32px] bg-gray-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-6">{t("notFound")}</h2>
        <button
          onClick={() => router.push(`/${locale}/dashboard/hearings`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRtl ? "العودة للجلسات" : "Back to Hearings"}
        </button>
      </div>
    );
  }

  const tabs = [
    {
      value: "overview",
      label: isRtl ? "نظرة عامة" : "Overview",
      icon: <Activity className="w-4 h-4" />
    },
    {
      value: "attachments",
      label: isRtl ? "المرفقات" : "Attachments",
      icon: <FileText className="w-4 h-4" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <HearingDetailHeader
        hearing={item}
        locale={locale}
        t={t}
        onEdit={() => setEditOpen(true)}
        onPostpone={() => setPostponeOpen(true)}
      />

      <PremiumTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        className="mb-6"
      />

      <div className="relative min-h-[500px]">
        <TabsContent value="overview" activeValue={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Details & Postponement */}
            <div className="lg:col-span-2 space-y-6">
              {/* Premium Info Card */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                      {isRtl ? "تفاصيل الجلسة" : "Hearing Information"}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                      {isRtl ? "العامة والجدولة" : "General & Scheduling"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("columns.date")}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{formatDate(item.hearingDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "الوقت" : "Time"}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{item.hearingTime || formatTime(item.hearingDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "المحكمة" : "Court"}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Building className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{item.court || "---"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.judge")}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Scale className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{item.judge || "---"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("columns.stage")}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">
                        {tCases(`stages.${item.stage}`) || item.stage || "---"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.assignedTo")}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{item.assignedToName || "---"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.summaryToClient")}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Info className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{item.summaryToClient || "---"}</p>
                    </div>
                  </div>

                  {item.timeSpent && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.timeSpent")}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-sm font-black text-gray-900">{item.timeSpent}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Postponement Block */}
                {item.isPostponed && item.postponedDate && (
                  <div className="mt-12 p-6 rounded-[24px] bg-amber-50/30 border border-amber-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-12 h-12 text-amber-600" />
                    </div>
                    <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" />
                      {isRtl ? "تفاصيل التأجيل" : "Postponement Information"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1">{isRtl ? "تاريخ الجلسة القادمة" : "New Date"}</p>
                        <p className="text-sm font-black text-amber-900">{formatDate(item.postponedDate)}</p>
                      </div>
                      {item.postponedTime && (
                        <div>
                          <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1">{isRtl ? "وقت الجلسة القادمة" : "New Time"}</p>
                          <p className="text-sm font-black text-amber-900">{item.postponedTime}</p>
                        </div>
                      )}
                    </div>
                    {item.postponementReason && (
                      <div className="mt-4 pt-4 border-t border-amber-100">
                        <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1">{isRtl ? "السبب" : "Reason"}</p>
                        <p className="text-sm font-bold text-amber-900/80 whitespace-pre-wrap">{item.postponementReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summaries & Comments */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {isRtl ? "محاضر الجلسة والتعليقات" : "Hearing Records & Comments"}
                  </h3>
                </div>

                <div className="space-y-6">
                  {item.summaryByLawyer && (
                    <div className="p-6 rounded-[24px] bg-gray-50 border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" />
                        {t("fields.notes")}
                      </h4>
                      <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {item.summaryByLawyer}
                      </p>
                    </div>
                  )}

                  {!item.summaryByLawyer && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[24px]">
                      <MessageSquare className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                        {isRtl ? "لا توجد ملاحظات مسجلة بعد" : "No notes recorded yet"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Case & Settings */}
            <div className="space-y-6">
              {/* Linked Case Card */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {isRtl ? "القضية المرتبطة" : "Linked Case"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <Link
                    href={`/${locale}/dashboard/cases/${item.caseId}`}
                    className="block group"
                  >
                    <div className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all duration-300">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">
                        {isRtl ? "اسم القضية" : "Case Title"}
                      </p>
                      <p className="text-sm font-black text-gray-900 truncate">
                        {item.caseTitle}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">
                        {item.caseNumber}/{item.caseYear}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={`/${locale}/dashboard/clients/${item.clientId}`}
                    className="block group"
                  >
                    <div className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 group-hover:bg-emerald-50/50 group-hover:border-emerald-100 transition-all duration-300">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">
                        {isRtl ? "العميل" : "Client"}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-emerald-600" />
                        </div>
                        <p className="text-sm font-black text-gray-900 truncate">
                          {item.clientName}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Visibility & Portal Card */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {isRtl ? "إعدادات الظهور" : "Visibility Settings"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/30">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.showInClientPortal")}</p>
                      <p className="text-[11px] font-bold text-gray-600">{isRtl ? "إظهار في البوابة" : "Show in portal"}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase border-none",
                      item.showInClientPortal ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                    )}>
                      {item.showInClientPortal ? (isRtl ? "ظاهر" : "Visible") : (isRtl ? "مخفي" : "Hidden")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/30">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.hasJudgment")}</p>
                      <p className="text-[11px] font-bold text-gray-600">{isRtl ? "هل صدر حكم؟" : "Issued?"}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase border-none",
                      item.hasJudgment ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-400"
                    )}>
                      {item.hasJudgment ? (isRtl ? "نعم" : "Yes") : (isRtl ? "لا" : "No")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments" activeValue={activeTab}>
          <HearingAttachmentsCard hearingId={id} />
        </TabsContent>
      </div>

      {/* Dialogs */}
      <HearingEditModal open={editOpen} onClose={() => setEditOpen(false)} hearingId={id} />
      <PostponeHearingDialog open={postponeOpen} onClose={() => setPostponeOpen(false)} onPostponed={fetchHearing} hearing={item} />
    </div>
  );
}

