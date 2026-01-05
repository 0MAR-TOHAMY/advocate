"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    X, FileText, Check, ChevronRight, ChevronLeft,
    Briefcase, Scale, Clock, AlertCircle, Download,
    Layout, Filter, CheckCircle2, Globe
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import ModalButton from "@/components/ui/ModalButton";
import { Badge } from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";

interface ReportBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    locale: string;
}

export default function ReportBuilderModal({
    isOpen,
    onClose,
    clientId,
    clientName,
    locale
}: ReportBuilderModalProps) {
    const t = useTranslations("reports");
    const tCommon = useTranslations("common");
    const isRtl = locale === "ar";

    const [step, setStep] = useState(1);
    const [reportType, setReportType] = useState<"full" | "summary">("full");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<{ cases: any[], works: any[] }>({ cases: [], works: [] });
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState(locale);

    // Fetch available content when modal opens
    useEffect(() => {
        if (isOpen && clientId) {
            setStep(1);
            fetchContent();
        }
    }, [isOpen, clientId]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            // Next.js will match [id] or [clientId] routes. We moved it to [id]/content-summary
            const res = await fetch(`/api/clients/${clientId}/content-summary`);
            if (res.ok) {
                const data = await res.json();
                setContent({ cases: data.cases || [], works: data.works || [] });
                // Auto-select all by default
                setSelectedCases(data.cases?.map((c: any) => c.id) || []);
                setSelectedWorks(data.works?.map((w: any) => w.id) || []);
            } else {
                console.error("Failed to fetch content summary:", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId,
                    type: reportType,
                    locale: selectedLocale,
                    content: {
                        cases: selectedCases,
                        works: selectedWorks
                    }
                })
            });

            if (!res.ok) throw new Error("Failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Report_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            onClose();
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setGenerating(false);
        }
    };

    const toggleCase = (id: string) => {
        setSelectedCases(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleWork = (id: string) => {
        setSelectedWorks(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                dir={isRtl ? "rtl" : "ltr"}
                                className={cn(
                                    "relative transform overflow-hidden rounded-[32px] bg-white text-start shadow-2xl transition-all w-full max-w-2xl border border-gray-100",
                                    isRtl ? "font-cairo" : ""
                                )}
                            >
                                {/* Header Section */}
                                <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-50/50 via-white to-white border-b border-gray-50 relative overflow-hidden text-start ltr:text-left rtl:text-right">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50/30 rounded-full -ml-12 -mb-12 blur-2xl" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3">
                                                <FileText className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                                    {isRtl ? "إنشاء تقرير للعميل" : "Generate Client Report"}
                                                </h3>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
                                                    {clientName}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Step Indicator */}
                                    <div className="flex items-center gap-2 mt-8">
                                        {[1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all duration-500",
                                                    step === i ? "w-12 bg-indigo-600" : "w-4 bg-gray-200"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Body Section */}
                                <div className="px-8 py-8 min-h-[400px]">
                                    {step === 1 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Layout className="w-4 h-4 text-indigo-500" />
                                                <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                                    {isRtl ? "اختر نوع التقرير" : "Select Report Type"}
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setReportType("full")}
                                                    className={cn(
                                                        "group relative p-6 rounded-3xl border-2 transition-all text-start overflow-hidden",
                                                        reportType === "full"
                                                            ? "border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50"
                                                            : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-4 text-indigo-600 transition-all",
                                                        isRtl ? "left-4" : "right-4"
                                                    )}>
                                                        {reportType === "full" && <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white" />}
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                                        reportType === "full" ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                    )}>
                                                        <Briefcase className="w-5 h-5" />
                                                    </div>
                                                    <div className="font-black text-[13px] text-gray-900 uppercase tracking-tight mb-2">
                                                        {isRtl ? "تقرير شامل" : "Full Report"}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-500 leading-relaxed uppercase tracking-wide">
                                                        {isRtl
                                                            ? "يتضمن الجلسات، المصروفات، والمهام بالتفصيل"
                                                            : "Includes hearings, expenses, and tasks in detail"}
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => setReportType("summary")}
                                                    className={cn(
                                                        "group relative p-6 rounded-3xl border-2 transition-all text-start overflow-hidden",
                                                        reportType === "summary"
                                                            ? "border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50"
                                                            : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-4 text-indigo-600 transition-all",
                                                        isRtl ? "left-4" : "right-4"
                                                    )}>
                                                        {reportType === "summary" && <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white" />}
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                                        reportType === "summary" ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                    )}>
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div className="font-black text-[13px] text-gray-900 uppercase tracking-tight mb-2">
                                                        {isRtl ? "تقرير ملخص" : "Summary Report"}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-500 leading-relaxed uppercase tracking-wide">
                                                        {isRtl
                                                            ? "نظرة عامة على حالة القضايا فقط"
                                                            : "Executive overview of case statuses only"}
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Language Selection */}
                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Globe className="w-4 h-4 text-indigo-500" />
                                                    <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                                        {isRtl ? "لغة التقرير" : "Report Language"}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setSelectedLocale("ar")}
                                                        className={cn(
                                                            "flex-1 py-3 px-4 rounded-2xl border-2 transition-all text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                                                            selectedLocale === "ar"
                                                                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                                                : "border-gray-100 text-gray-400 hover:border-gray-200"
                                                        )}
                                                    >
                                                        {selectedLocale === "ar" && <Check className="w-4 h-4" />}
                                                        العربية
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedLocale("en")}
                                                        className={cn(
                                                            "flex-1 py-3 px-4 rounded-2xl border-2 transition-all text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                                                            selectedLocale === "en"
                                                                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                                                : "border-gray-100 text-gray-400 hover:border-gray-200"
                                                        )}
                                                    >
                                                        {selectedLocale === "en" && <Check className="w-4 h-4" />}
                                                        English
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="w-4 h-4 text-indigo-500" />
                                                    <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                                        {isRtl ? "تحديد المحتوى المراد إدراجه" : "Select Content to Include"}
                                                    </h4>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const allIds = [...content.cases, ...content.works].map(i => i.id);
                                                        const isAllSelected = selectedCases.length + selectedWorks.length === allIds.length;
                                                        if (isAllSelected) {
                                                            setSelectedCases([]);
                                                            setSelectedWorks([]);
                                                        } else {
                                                            setSelectedCases(content.cases.map(i => i.id));
                                                            setSelectedWorks(content.works.map(i => i.id));
                                                        }
                                                    }}
                                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                                >
                                                    {selectedCases.length + selectedWorks.length > 0 ? (isRtl ? "إلغاء الكل" : "Unselect All") : (isRtl ? "تحديد الكل" : "Select All")}
                                                </button>
                                            </div>

                                            {loading ? (
                                                <div className="flex flex-col items-center justify-center py-12">
                                                    <Loader />
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-4">
                                                        {isRtl ? "جاري جلب القضايا..." : "Fetching Content..."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {content.cases.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 px-2">
                                                                <Scale className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isRtl ? "النظام القضائي (القضايا)" : "Judicial System (Cases)"}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {content.cases.map(c => (
                                                                    <div
                                                                        key={c.id}
                                                                        onClick={() => toggleCase(c.id)}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                            selectedCases.includes(c.id)
                                                                                ? "border-indigo-100 bg-indigo-50/30"
                                                                                : "border-gray-100 hover:border-indigo-100 hover:bg-gray-50"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                                                                selectedCases.includes(c.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200 group-hover:border-indigo-300"
                                                                            )}>
                                                                                {selectedCases.includes(c.id) && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                                                            </div>
                                                                            <span className="text-[12px] font-bold text-gray-900 tracking-tight">{c.title}</span>
                                                                        </div>
                                                                        <Badge className="!text-[8px] font-black uppercase tracking-widest !bg-white !border-gray-100 !text-gray-400 group-hover:!text-indigo-600">Case</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {content.works.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 px-2">
                                                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isRtl ? "الأعمال والخدمات العامة" : "General Work & Services"}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {content.works.map(w => (
                                                                    <div
                                                                        key={w.id}
                                                                        onClick={() => toggleWork(w.id)}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                            selectedWorks.includes(w.id)
                                                                                ? "border-indigo-100 bg-indigo-50/30"
                                                                                : "border-gray-100 hover:border-indigo-100 hover:bg-gray-50"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                                                                selectedWorks.includes(w.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200 group-hover:border-indigo-300"
                                                                            )}>
                                                                                {selectedWorks.includes(w.id) && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                                                            </div>
                                                                            <span className="text-[12px] font-bold text-gray-900 tracking-tight">{w.title}</span>
                                                                        </div>
                                                                        <Badge className="!text-[8px] font-black uppercase tracking-widest !bg-white !border-gray-100 !text-gray-400 group-hover:!text-indigo-600">Work</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!loading && content.cases.length === 0 && content.works.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                                            <AlertCircle className="w-10 h-10 text-gray-200 mb-4" />
                                                            <p className="text-[12px] font-bold text-gray-400">{isRtl ? "لا توجد قضايا أو أعمال مسجلة لهذا العميل" : "No cases or works found for this client"}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row-reverse items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        {step === 1 ? (
                                            <ModalButton
                                                onClick={() => setStep(2)}
                                                className="!h-12 !px-8 rounded-2xl flex-1 sm:flex-none shadow-lg shadow-indigo-100 group"
                                            >
                                                {isRtl ? "استمرار" : "Continue"}
                                                {isRtl ? <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                            </ModalButton>
                                        ) : (
                                            <ModalButton
                                                onClick={handleGenerate}
                                                loading={generating}
                                                disabled={generating || (selectedCases.length === 0 && selectedWorks.length === 0)}
                                                className="!h-12 !px-8 rounded-2xl flex-1 sm:flex-none shadow-lg shadow-emerald-100 !bg-emerald-600 hover:!bg-emerald-700 border-none"
                                            >
                                                <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                                {generating ? (isRtl ? "جاري الإنشاء..." : "Generating...") : (isRtl ? "إنشاء التقرير" : "Generate Report")}
                                            </ModalButton>
                                        )}

                                        {step === 2 && (
                                            <button
                                                onClick={() => setStep(1)}
                                                disabled={generating}
                                                className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all"
                                            >
                                                {isRtl ? "رجوع" : "Back"}
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={onClose}
                                        disabled={generating}
                                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors"
                                    >
                                        {tCommon("cancel")}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
