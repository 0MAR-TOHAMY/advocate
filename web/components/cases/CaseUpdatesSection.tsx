"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    Zap, Plus, AlertCircle, CheckCircle2,
    Trash2, Calendar, Info, Search,
    ArrowRight, MessageSquare, ListTodo, Target,
    Edit2, Eye
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { UniversalTabSection } from "./tabs/UniversalTabSection";
import { cn } from "@/lib/utils";

type CaseUpdate = {
    id: string;
    updateType: string;
    title: string;
    description: string;
    isImportant: boolean;
    nextSteps: string | null;
    outcome: string | null;
    createdAt: string;
};

interface CaseUpdatesSectionProps {
    caseId: string;
    onUpdateAdded?: () => void;
    updates?: CaseUpdate[];
    loading?: boolean;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

export default function CaseUpdatesSection({
    caseId,
    onUpdateAdded,
    updates = [],
    loading = false,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange
}: CaseUpdatesSectionProps) {
    const t = useTranslations("cases.updates");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const isLoading = loading;
    // const [updates, setUpdates] = useState<CaseUpdate[]>([]); // handled by parent
    // const [isLoading, setIsLoading] = useState(true); // handled by parent
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // View/Edit state
    const [viewingUpdate, setViewingUpdate] = useState<CaseUpdate | null>(null);
    const [editingUpdate, setEditingUpdate] = useState<CaseUpdate | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [updateType, setUpdateType] = useState("other");
    const [isImportant, setIsImportant] = useState(false);
    const [nextSteps, setNextSteps] = useState("");
    const [outcome, setOutcome] = useState("");

    // useEffect(() => {
    //     fetchUpdates();
    // }, [caseId]);

    // const fetchUpdates = async () => { ... } // Removed

    const handleSave = async () => {
        if (!title || !description || !updateType) return;
        setIsSaving(true);
        try {
            const url = editingUpdate
                ? `/api/cases/${caseId}/updates?updateId=${editingUpdate.id}`
                : `/api/cases/${caseId}/updates`;

            const res = await fetch(url, {
                method: editingUpdate ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    updateType,
                    isImportant,
                    nextSteps,
                    outcome
                })
            });
            if (res.ok) {
                setIsAdding(false);
                setEditingUpdate(null);
                // fetchUpdates(); // Handled by parent
                if (onUpdateAdded) onUpdateAdded();
                resetForm();
            }
        } catch (error) {
            console.error("Error saving update:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setUpdateType("other");
        setIsImportant(false);
        setNextSteps("");
        setOutcome("");
    };

    const handleEdit = (update: CaseUpdate) => {
        setEditingUpdate(update);
        setTitle(update.title);
        setDescription(update.description);
        setUpdateType(update.updateType);
        setIsImportant(update.isImportant);
        setNextSteps(update.nextSteps || "");
        setOutcome(update.outcome || "");
    };

    const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!updateToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/updates?updateId=${updateToDelete}`, {
                method: "DELETE"
            });
            if (res.ok) {
                // fetchUpdates(); // Handled by parent
                if (onUpdateAdded) onUpdateAdded();
                setUpdateToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting update:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getUpdateTypeStyles = (type: string) => {
        switch (type) {
            case "judgment": return "bg-rose-50 text-rose-600 border-rose-100";
            case "hearing_scheduled": return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case "hearing_result": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "settlement": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            default: return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const dateFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            <UniversalTabSection
                title={t("title")}
                icon={Zap}
                count={updates.length}
                countLabel={isRtl ? "تحديثاً مسجلاً" : "Updates Recorded"}
                addButtonLabel={t("addUpdate")}
                onAdd={() => { resetForm(); setEditingUpdate(null); setIsAdding(true); }}
                data={updates}
                loading={isLoading}
                isRtl={isRtl}
                colorScheme="amber"
                emptyTitle={t("noUpdates")}
                emptyDescription={isRtl
                    ? "لا توجد تحديثات لهذه القضية بعد. ابدأ بإضافة أول تحديث."
                    : "No updates have been recorded for this case yet. Start by adding the first one."}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={onPageChange}
                tipIcon={MessageSquare}
                tipTitle={isRtl ? "متابعة تطورات القضية" : "Tracking Case Progress"}
                tipDescription={isRtl
                    ? "سجل جميع التحديثات والمراسلات الهامة هنا لتبقى أنت وفريقك على اطلاع دائم بآخر المستجدات."
                    : "Record all significant updates and communications here to keep you and your team informed of the latest developments."}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "النوع" : "Type"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "التحديث" : "Update"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "التاريخ" : "Date"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tCommon("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {updates.map((update) => (
                                <tr key={update.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn("text-[9px] px-2.5 py-1 border font-black uppercase tracking-wider", getUpdateTypeStyles(update.updateType))}>
                                                {t(`types.${update.updateType}`)}
                                            </Badge>
                                            {update.isImportant && (
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-[400px]">
                                            <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-1 line-clamp-1">
                                                {update.title}
                                            </h4>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap">
                                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                            {dateFormatter.format(new Date(update.createdAt))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingUpdate(update)}
                                                title={tCommon("view")}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(update)}
                                                title={tCommon("edit")}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setUpdateToDelete(update.id)}
                                                title={tCommon("delete")}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </UniversalTabSection>

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isAdding || !!editingUpdate}
                onClose={() => { setIsAdding(false); setEditingUpdate(null); }}
                title={editingUpdate ? tCommon("edit") : t("addUpdate")}
                className="!max-w-[500px]"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("updateType")}</Label>
                            <Select
                                value={updateType}
                                onChange={setUpdateType}
                                options={[
                                    { label: t("types.hearing_scheduled"), value: "hearing_scheduled" },
                                    { label: t("types.hearing_result"), value: "hearing_result" },
                                    { label: t("types.status_change"), value: "status_change" },
                                    { label: t("types.judgment"), value: "judgment" },
                                    { label: t("types.settlement"), value: "settlement" },
                                    { label: t("types.appeal_filed"), value: "appeal_filed" },
                                    { label: t("types.document_filed"), value: "document_filed" },
                                    { label: t("types.payment_received"), value: "payment_received" },
                                    { label: t("types.deadline_approaching"), value: "deadline_approaching" },
                                    { label: t("types.other"), value: "other" }
                                ]}
                                className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-2 shrink-0">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("important")}</Label>
                            <div
                                onClick={() => setIsImportant(!isImportant)}
                                className={cn(
                                    "h-12 px-6 rounded-xl border flex items-center gap-4 cursor-pointer transition-all active:scale-95",
                                    isImportant ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-gray-50/50 border-gray-100 text-gray-400 hover:border-gray-200"
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{isImportant ? tCommon("yes") : tCommon("no")}</span>
                                <div className={cn(
                                    "w-3 h-3 rounded-full border-2",
                                    isImportant ? "bg-amber-600 border-amber-400" : "bg-white border-gray-200"
                                )} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "عنوان التحديث" : "Update Title"}</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={isRtl ? "مثال: تم إيداع المذكرة..." : "e.g. Memo has been filed..."}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</Label>
                        <div className="relative bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden transition-all focus-within:bg-white focus-within:border-indigo-600/30">
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={isRtl ? "اكتب تفاصيل التحديث هنا..." : "Write update details here..."}
                                rows={4}
                                className="!bg-transparent !border-none !shadow-none p-4 text-[13px] font-medium leading-relaxed resize-none focus:!ring-0 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("outcome")}</Label>
                        <div className="relative bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden transition-all focus-within:bg-white focus-within:border-emerald-600/30">
                            <Textarea
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                                placeholder={isRtl ? "النتيجة (إن وجدت)..." : "Outcome (if any)..."}
                                rows={2}
                                className="!bg-transparent !border-none !shadow-none p-3 text-[12px] font-medium leading-tight resize-none focus:!ring-0 min-h-[60px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("nextSteps")}</Label>
                        <div className="relative bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden transition-all focus-within:bg-white focus-within:border-indigo-600/30">
                            <Textarea
                                value={nextSteps}
                                onChange={(e) => setNextSteps(e.target.value)}
                                placeholder={isRtl ? "الخطوات التالية..." : "Next steps..."}
                                rows={2}
                                className="!bg-transparent !border-none !shadow-none p-3 text-[12px] font-medium leading-tight resize-none focus:!ring-0 min-h-[60px]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => { setIsAdding(false); setEditingUpdate(null); }}
                            disabled={isSaving}
                            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleSave}
                            loading={isSaving}
                            className="flex-1 !bg-amber-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border-none"
                        >
                            {tCommon("save")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingUpdate}
                onClose={() => setViewingUpdate(null)}
                title={isRtl ? "تفاصيل التحديث" : "Update Details"}
                className="!max-w-[500px]"
            >
                {viewingUpdate && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Zap className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t("updateType")}</p>
                                </div>
                                <Badge variant="outline" className={cn("text-[10px] px-2.5 py-1 border font-black uppercase tracking-wider", getUpdateTypeStyles(viewingUpdate.updateType))}>
                                    {t(`types.${viewingUpdate.updateType}`)}
                                </Badge>
                            </div>
                            <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "التاريخ" : "Date"}</p>
                                </div>
                                <p className="text-[13px] font-black text-gray-900">
                                    {dateFormatter.format(new Date(viewingUpdate.createdAt))}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 px-1">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "العنوان" : "Title"}</p>
                                    {viewingUpdate.isImportant && (
                                        <Badge variant="outline" className="bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 border-none">
                                            {t("important")}
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-[16px] font-black text-gray-900 leading-snug">
                                    {viewingUpdate.title}
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</p>
                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100/50">
                                    <p className="text-[14px] text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                                        {viewingUpdate.description}
                                    </p>
                                </div>
                            </div>

                            {viewingUpdate.outcome && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                        <Target className="w-3 h-3" />
                                        {t("outcome")}
                                    </p>
                                    <div className="p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                                        <p className="text-[13px] text-emerald-900 font-bold leading-relaxed whitespace-pre-wrap">
                                            {viewingUpdate.outcome}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {viewingUpdate.nextSteps && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <ListTodo className="w-3 h-3" />
                                        {t("nextSteps")}
                                    </p>
                                    <div className="p-5 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                                        <p className="text-[13px] text-indigo-900 font-bold leading-relaxed whitespace-pre-wrap">
                                            {viewingUpdate.nextSteps}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setViewingUpdate(null)}
                                className="px-10 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                            >
                                {tCommon("close")}
                            </ModalButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!updateToDelete}
                onClose={() => setUpdateToDelete(null)}
                title={isRtl ? "حذف التحديث" : "Delete Update"}
                className="!max-w-[400px]"
            >
                <div className="space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-[32px] bg-rose-50 flex items-center justify-center mx-auto border-none">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {isRtl ? "هل أنت متأكد؟" : "Are you sure?"}
                            </h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {isRtl ? "سيتم حذف التحديث ولا يمكن التراجع" : "Update delete is permanent"}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                        {tCommon("areYouSureDelete")}
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setUpdateToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleDelete}
                            loading={isDeleting}
                            className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border-none"
                        >
                            {tCommon("delete")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
