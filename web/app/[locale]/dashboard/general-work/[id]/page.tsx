/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import {
    Activity,
    FileText,
    LayoutGrid,
    Calendar,
    Briefcase,
    User,
    DollarSign,
    Flag,
    AlertCircle,
} from "lucide-react";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { TabsContent } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import AlertModal from "@/components/ui/AlertModal";
import { GeneralWorkDetailHeader } from "@/components/general-work/GeneralWorkDetailHeader";
import GeneralWorkAttachmentsCard from "@/components/general-work/GeneralWorkAttachmentsCard";
import GeneralWorkEditModal from "@/components/general-work/GeneralWorkEditModal";
import Link from "next/link";
import { format } from "date-fns";

export default function GeneralWorkDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const resolvedParams = use(params);
    const t = useTranslations("generalWork");
    const tCommon = useTranslations("common");
    const routeParams = useParams();
    const router = useRouter();
    const locale = (routeParams?.locale as string) || "en";
    const isRtl = locale === "ar";
    const id = resolvedParams.id;

    const [work, setWork] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [completeAlertOpen, setCompleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchWork();
    }, [id]);

    const fetchWork = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/general-work/${id}`);
            if (response.ok) {
                const data = await response.json();
                setWork(data);
            }
        } catch (error) {
            console.error("Error fetching work:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/general-work/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                router.push(`/${locale}/dashboard/general-work`);
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting work:", error);
        } finally {
            setIsDeleting(false);
            setDeleteAlertOpen(false);
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        try {
            const response = await fetch(`/api/general-work/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "completed",
                    completionDate: new Date().toISOString()
                })
            });
            if (response.ok) {
                fetchWork();
            }
        } catch (error) {
            console.error("Error completing work:", error);
        } finally {
            setIsCompleting(false);
            setCompleteAlertOpen(false);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return "-";
        return new Date(d).toLocaleString(locale, {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    };

    const formatMoney = (amount: number | null) => {
        if (amount == null) return "-";
        return (amount / 1000).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (!work) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-[32px] bg-gray-50 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-gray-200" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-6">{t("noWork")}</h2>
                <Button
                    onClick={() => router.push(`/${locale}/dashboard/general-work`)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-black uppercase text-xs tracking-widest"
                >
                    {t("backToWork")}
                </Button>
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
            <GeneralWorkDetailHeader
                work={work}
                locale={locale}
                t={t}
                onEdit={() => setEditOpen(true)}
                onDelete={() => setDeleteAlertOpen(true)}
                onComplete={() => setCompleteAlertOpen(true)}
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
                        {/* Left Column: Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* General Info Card */}
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                        <LayoutGrid className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                            {t("workInfo")}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                                            {isRtl ? "التفاصيل الأساسية" : "Basic Details"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("client")}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <User className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <Link href={`/${locale}/dashboard/clients/${work.clientId}`} className="hover:underline text-sm font-black text-gray-900">
                                                {work.clientName || "-"}
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("workTitle")}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <p className="text-sm font-black text-gray-900">{work.title}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</p>
                                        <div className="p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 leading-relaxed">
                                            {work.description || "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dates Card */}
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                            {t("timeline")}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                                            {isRtl ? "المواعيد والتواريخ" : "Dates & Deadlines"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("startDate")}</p>
                                        <p className="text-sm font-bold text-gray-900">{formatDate(work.startDate)}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("dueDate")}</p>
                                        <p className="text-sm font-bold text-gray-900 text-orange-600">{formatDate(work.dueDate)}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("completionDate")}</p>
                                        <p className="text-sm font-bold text-gray-900">{formatDate(work.completionDate)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Financials & Status */}
                        <div className="space-y-6">
                            {/* Financials Card */}
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                            {t("financialInfo")}
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500">{t("fee")}</span>
                                        <span className="text-lg font-black text-gray-900">{formatMoney(work.fee)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500">{t("paidAmount")}</span>
                                        <span className="text-lg font-black text-emerald-600">{formatMoney(work.paid)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-500">{t("paymentStatus")}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded text-gray-600">{t(`paymentStatuses.${work.paymentStatus}`)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${work.fee ? Math.min(100, (work.paid || 0) / work.fee * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Priority & Assignment Card */}
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t("priority")}</p>
                                        <div className="flex items-center gap-2">
                                            <Flag className={
                                                work.priority === "urgent" ? "text-red-500" :
                                                    work.priority === "high" ? "text-orange-500" :
                                                        work.priority === "medium" ? "text-blue-500" : "text-gray-400"
                                            } />
                                            <span className="font-bold text-gray-900">{t(`priorities.${work.priority}`)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t("assigned")}</p>
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100 uppercase">
                                                {(work.assignedToName || work.assignedTo || "?").charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{work.assignedToName || work.assignedTo || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="attachments" activeValue={activeTab}>
                    <GeneralWorkAttachmentsCard
                        workId={id}
                    />
                </TabsContent>
            </div>

            <GeneralWorkEditModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                workId={id}
                onSaved={() => {
                    fetchWork();
                }}
            />

            <AlertModal
                isOpen={deleteAlertOpen}
                onClose={() => setDeleteAlertOpen(false)}
                onConfirm={handleDelete}
                type="error"
                title={t("deleteWork")}
                message={t("confirmDelete")}
                confirmText={isDeleting ? tCommon("loading") : tCommon("delete")}
                cancelText={tCommon("cancel")}
            />

            <AlertModal
                isOpen={completeAlertOpen}
                onClose={() => setCompleteAlertOpen(false)}
                onConfirm={handleComplete}
                type="success"
                title={t("markAsCompleted")}
                message={t("confirmComplete")}
                confirmText={isCompleting ? tCommon("loading") : tCommon("confirm")}
                cancelText={tCommon("cancel")}
            />
        </div>
    );
}
