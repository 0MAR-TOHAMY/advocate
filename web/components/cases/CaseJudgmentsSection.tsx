"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    Gavel, Calendar, Plus, Clock, FileText,
    AlertCircle, Trash2, ArrowRight, User,
    ChevronRight, ChevronLeft, Scale, Edit2, Eye
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { UniversalTabSection } from "./tabs/UniversalTabSection";
import { cn } from "@/lib/utils";

type Judgment = {
    id: string;
    judgmentDate: string;
    judgmentSummary: string;
    judgmentType: "favor" | "against" | "partial";
    judgeName: string | null;
    courtDecision: string | null;
    appealDeadline: string;
    attachmentUrl: string | null;
    createdAt: string;
};

interface CaseJudgmentsSectionProps {
    caseId: string;
    onJudgmentAdded?: () => void;
    judgments?: Judgment[];
    loading?: boolean;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

export default function CaseJudgmentsSection({
    caseId,
    onJudgmentAdded,
    judgments = [],
    loading = false,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange
}: CaseJudgmentsSectionProps) {
    const t = useTranslations("cases.judgments");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    // const [judgments, setJudgments] = useState<Judgment[]>([]); // handled by parent
    // const [isLoading, setIsLoading] = useState(true); // handled by parent
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // View/Edit state
    const [viewingJudgment, setViewingJudgment] = useState<Judgment | null>(null);
    const [editingJudgment, setEditingJudgment] = useState<Judgment | null>(null);

    // Form state
    const [judgmentDate, setJudgmentDate] = useState("");
    const [judgmentSummary, setJudgmentSummary] = useState("");
    const [judgmentType, setJudgmentType] = useState<any>("favor");
    const [judgeName, setJudgeName] = useState("");
    const [courtDecision, setCourtDecision] = useState("");

    // useEffect(() => {
    //     fetchJudgments();
    // }, [caseId]);

    // const fetchJudgments = async () => { ... } // Removed

    const isLoading = loading;

    const handleSave = async () => {
        if (!judgmentDate || !judgmentSummary || !judgmentType) return;
        setIsSaving(true);
        try {
            const url = editingJudgment
                ? `/api/cases/${caseId}/judgments?judgmentId=${editingJudgment.id}`
                : `/api/cases/${caseId}/judgments`;

            const res = await fetch(url, {
                method: editingJudgment ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    judgmentDate,
                    judgmentSummary,
                    judgmentType,
                    judgeName,
                    courtDecision
                })
            });
            if (res.ok) {
                setIsAdding(false);
                setEditingJudgment(null);
                // fetchJudgments(); // Handled by parent
                if (onJudgmentAdded) onJudgmentAdded();
                resetForm();
            }
        } catch (error) {
            console.error("Error saving judgment:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setJudgmentDate("");
        setJudgmentSummary("");
        setJudgeName("");
        setCourtDecision("");
        setJudgmentType("favor");
    };

    const [judgmentToDelete, setJudgmentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!judgmentToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/judgments?judgmentId=${judgmentToDelete}`, {
                method: "DELETE"
            });
            if (res.ok) {
                // fetchJudgments(); // Handled by parent
                if (onJudgmentAdded) onJudgmentAdded();
                setJudgmentToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting judgment:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (j: Judgment) => {
        setEditingJudgment(j);
        setJudgmentDate(j.judgmentDate);
        setJudgmentSummary(j.judgmentSummary);
        setJudgmentType(j.judgmentType);
        setJudgeName(j.judgeName || "");
        setCourtDecision(j.courtDecision || "");
    };

    const getRemainingDays = (deadline: string) => {
        const diff = new Date(deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case "favor": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "against": return "bg-rose-50 text-rose-600 border-rose-100";
            case "partial": return "bg-amber-50 text-amber-600 border-amber-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getDeadlineStyles = (days: number) => {
        if (days < 0) return "bg-slate-900 text-white border-slate-800";
        if (days <= 7) return "bg-rose-50 text-rose-600 border-rose-100";
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
    };

    return (
        <>
            <UniversalTabSection
                title={t("title")}
                icon={Scale}
                count={judgments.length}
                countLabel={isRtl ? "أحكام مسجلة" : "Judgments Recorded"}
                addButtonLabel={t("addJudgment")}
                onAdd={() => { resetForm(); setEditingJudgment(null); setIsAdding(true); }}
                data={judgments}
                loading={isLoading}
                isRtl={isRtl}
                colorScheme="brand"
                emptyTitle={isRtl ? "لا توجد أحكام بعد" : "No Judgments Yet"}
                emptyDescription={isRtl
                    ? "لم يتم تسجيل أي أحكام لهذه القضية حتى الآن. أضف أول حكم الآن."
                    : "No judgments have been recorded for this case yet. Add the first one now."}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={onPageChange}
                tipTitle={isRtl ? "تنبيه مواعيد الاستئناف" : "Appeal Deadline Tip"}
                tipDescription={isRtl
                    ? "يتم احتساب مهلة الاستئناف تلقائياً (30 يوماً). تظهر الأحكام الهامة والمواعيد النهائية في لوحة التحكم لضمان عدم فوات المواعيد."
                    : "The appeal deadline is automatically calculated (30 days). Important judgments and deadlines appear on the dashboard to ensure no deadlines are missed."}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "نوع الحكم" : "Type"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "الملخص" : "Summary"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "التاريخ والقاضي" : "Date & Judge"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "مهلة الاستئناف" : "Appeal Deadline"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tCommon("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {judgments.map((j) => {
                                const daysLeft = getRemainingDays(j.appealDeadline);
                                return (
                                    <tr key={j.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={cn("text-[9px] px-2.5 py-1 border font-black uppercase tracking-wider", getTypeStyles(j.judgmentType))}>
                                                {t(`types.${j.judgmentType}`)}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-tight transition-colors line-clamp-2 max-w-[250px]">
                                                {j.judgmentSummary}
                                            </h4>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-900 font-black text-[12px] uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                    {new Date(j.judgmentDate).toLocaleDateString(locale)}
                                                </div>
                                                {j.judgeName && (
                                                    <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest pl-5">
                                                        <User className="w-3 h-3" />
                                                        {j.judgeName}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest", getDeadlineStyles(daysLeft))}>
                                                <Clock className="w-3.5 h-3.5" />
                                                {daysLeft < 0 ? t("expired") : `${daysLeft} ${t("daysRemaining")}`}
                                            </div>
                                            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1 pr-6 italic">
                                                {new Date(j.appealDeadline).toLocaleDateString(locale)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setViewingJudgment(j)}
                                                    title={tCommon("view")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(j)}
                                                    title={tCommon("edit")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setJudgmentToDelete(j.id)}
                                                    title={tCommon("delete")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </UniversalTabSection>

            <Modal
                isOpen={isAdding || !!editingJudgment}
                onClose={() => { setIsAdding(false); setEditingJudgment(null); }}
                title={editingJudgment ? tCommon("edit") : t("addJudgment")}
                className="!max-w-[500px]"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("judgmentDate")}</Label>
                            <DateTimeInput
                                locale={locale}
                                value={judgmentDate}
                                onChange={setJudgmentDate}
                                placeholder={t("judgmentDate") as string}
                                className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("judgmentType")}</Label>
                            <Select
                                value={judgmentType}
                                onChange={setJudgmentType}
                                options={[
                                    { label: t("types.favor"), value: "favor" },
                                    { label: t("types.against"), value: "against" },
                                    { label: t("types.partial"), value: "partial" }
                                ]}
                                className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("judgeName")}</Label>
                        <Input
                            value={judgeName}
                            onChange={(e) => setJudgeName(e.target.value)}
                            placeholder={isRtl ? "اسم القاضي..." : "Judge name..."}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("judgmentSummary")}</Label>
                        <Input
                            value={judgmentSummary}
                            onChange={(e) => setJudgmentSummary(e.target.value)}
                            placeholder={isRtl ? "ملخص الحكم..." : "Judgment summary..."}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("courtDecision")}</Label>
                        <div className="relative bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden transition-all focus-within:bg-white focus-within:border-indigo-600/30">
                            <Textarea
                                value={courtDecision}
                                onChange={(e) => setCourtDecision(e.target.value)}
                                placeholder={isRtl ? "نص القرار كاملاً..." : "Full court decision text..."}
                                rows={4}
                                className="!bg-transparent !border-none !shadow-none p-4 text-[13px] font-medium leading-relaxed resize-none focus:!ring-0 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-5 rounded-[24px] border border-amber-100/50 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-100/50">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none mb-1">
                                {isRtl ? "ملاحظة هامة" : "Important Note"}
                            </p>
                            <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed">
                                {tCommon("appealDeadlineNote") || "Appeal deadline will be set to +30 days from the judgment date automatically."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => { setIsAdding(false); setEditingJudgment(null); }}
                            disabled={isSaving}
                            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleSave}
                            loading={isSaving}
                            className="flex-1 !bg-brand-primary text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {tCommon("save")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!viewingJudgment}
                onClose={() => setViewingJudgment(null)}
                title={t("viewDetails") || (isRtl ? "تفاصيل الحكم" : "Judgment Details")}
                className="!max-w-[500px]"
            >
                {viewingJudgment && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Scale className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t("judgmentType")}</p>
                                </div>
                                <Badge variant="outline" className={cn("text-[10px] px-2.5 py-1 border font-black uppercase tracking-wider", getTypeStyles(viewingJudgment.judgmentType))}>
                                    {t(`types.${viewingJudgment.judgmentType}`)}
                                </Badge>
                            </div>
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t("judgmentDate")}</p>
                                </div>
                                <p className="text-[13px] font-black text-gray-900">
                                    {new Date(viewingJudgment.judgmentDate).toLocaleDateString(locale)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <User className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t("judgeName")}</p>
                                </div>
                                <p className="text-[13px] font-bold text-gray-700">
                                    {viewingJudgment.judgeName || "---"}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t("appealDeadline")}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[13px] font-bold text-gray-700">
                                        {new Date(viewingJudgment.appealDeadline).toLocaleDateString(locale)}
                                    </p>
                                    <span className={cn("text-[9px] font-black uppercase tracking-tight", getRemainingDays(viewingJudgment.appealDeadline) < 0 ? "text-rose-600" : "text-indigo-600")}>
                                        {getRemainingDays(viewingJudgment.appealDeadline) < 0 ? t("expired") : `${getRemainingDays(viewingJudgment.appealDeadline)} ${t("daysRemaining")}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 px-1">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("judgmentSummary")}</p>
                                <h3 className="text-[16px] font-black text-gray-900 leading-snug">
                                    {viewingJudgment.judgmentSummary}
                                </h3>
                            </div>

                            {viewingJudgment.courtDecision && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("courtDecision")}</p>
                                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100/50">
                                        <p className="text-[14px] text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                                            {viewingJudgment.courtDecision}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setViewingJudgment(null)}
                                className="px-10 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                {tCommon("close")}
                            </ModalButton>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!judgmentToDelete}
                onClose={() => setJudgmentToDelete(null)}
                title={isRtl ? "حذف الحكم" : "Delete Judgment"}
                className="!max-w-[400px]"
            >
                <div className="space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-[32px] bg-rose-50 flex items-center justify-center mx-auto">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {isRtl ? "هل أنت متأكد؟" : "Are you sure?"}
                            </h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {isRtl ? "سيتم حذف الحكم ولا يمكن التراجع" : "Judgment delete is permanent"}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                        {tCommon("areYouSureDelete") || "Are you sure you want to delete this judgment?"}
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setJudgmentToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleDelete}
                            loading={isDeleting}
                            className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                        >
                            {tCommon("delete")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>
        </>
    );
}


