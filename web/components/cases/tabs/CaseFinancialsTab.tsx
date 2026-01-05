"use client";

import React, { useState } from "react";
import { DollarSign, Plus, Calculator, Wallet, Receipt, Info, Edit2, Trash2, Eye, Calendar, ArrowRight } from "lucide-react";
import { UniversalTabSection } from "./UniversalTabSection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ModalButton from "@/components/ui/ModalButton";

interface CaseFinancialsTabProps {
    expenses: any[];
    caseData: any;
    locale: string;
    t: any;
    tCommon: any;
    onAddExpense: () => void;
    onEdit?: (expense: any) => void;
    onDelete?: (expense: any) => void;
    // Integration props
    loading?: boolean;
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

const expenseTypeMap: Record<string, string> = {
    "filing_registration_fees": "filingRegistrationFees",
    "expert_expenses": "expertExpenses",
    "notification_expenses": "notificationExpenses",
    "petition_expenses": "petitionExpenses",
    "legal_notice_expenses": "legalNoticeExpenses",
    "translation_fees": "translationFees",
    "travel_expenses": "travelExpenses",
    "witness_fees": "witnessFees",
    "bailiff_enforcement_fees": "bailiffEnforcementFees",
    "appeal_fees": "appealFees",
    "consultation_fees": "consultationFees",
    "court_transcript_fees": "courtTranscriptFees",
    "document_preparation_fees": "documentPreparationFees",
    "other": "other"
};

export function CaseFinancialsTab({
    expenses,
    caseData,
    locale,
    t,
    tCommon,
    onAddExpense,
    onEdit,
    onDelete,
    loading = false,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange
}: CaseFinancialsTabProps) {
    const isRtl = locale === "ar";
    const totalExpenses = expenses.filter(e => e.category === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalCollected = expenses.filter(e => e.category === 'collection').reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const [viewingExpense, setViewingExpense] = useState<any | null>(null);

    const getTranslationKey = (type: string) => {
        return expenseTypeMap[type] || type;
    };

    return (
        <React.Fragment>
            <UniversalTabSection
                title={t("financialInfo")}
                icon={Wallet}
                count={totalCount || expenses.length}
                countLabel={isRtl ? "معاملات مالية" : "Transactions"}
                addButtonLabel={t("recordExpense")}
                onAdd={onAddExpense}
                data={expenses}
                loading={loading}
                isRtl={isRtl}
                colorScheme="blue"
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={onPageChange}
                emptyTitle={isRtl ? "لا توجد معاملات مسجلة" : "No Transactions Recorded"}
                emptyDescription={isRtl
                    ? "لم تقم بتسجيل أي مصروفات أو تحصيلات لهذه القضية بعد."
                    : "You haven't recorded any expenses or collections for this case yet."}
                tipIcon={Calculator}
                tipTitle={isRtl ? "إدارة التكاليف" : "Financial Management Tip"}
                tipDescription={isRtl
                    ? "تساعدك متابعة المصروفات بدقة على إصدار فواتير دقيقة للعملاء. يمكنك تنزيل تقرير مالي مفصل من قسم التقارير."
                    : "Accurate expense tracking helping you issue precise invoices for clients. You can download a detailed financial report from the reports section."}
            >
                <div className="space-y-6">
                    {/* Financial Stats Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 p-4">
                        <div className="bg-white p-4 rounded-[20px] border border-gray-100 flex items-center justify-between gap-5 transition-all hover:border-blue-100">
                            <div className="mx-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t("claimAmount")}</p>
                                <h4 className="text-xl font-black text-gray-900 leading-tight">
                                    {caseData.claimAmount?.toLocaleString(locale) || "0"}
                                    <span className="text-xs text-gray-400 ml-1 font-bold">{caseData.currency || "AED"}</span>
                                </h4>
                            </div>
                            <div className="w-12 h-12 rounded-[20px] bg-blue-50 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-[20px] border border-gray-100 flex items-center justify-between gap-5 transition-all hover:border-rose-100">
                            <div className="mx-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    {isRtl ? "إجمالي المصروفات" : "Total Expenses"}
                                </p>
                                <h4 className="text-xl font-black text-rose-600 leading-tight">
                                    {totalExpenses.toLocaleString(locale)}
                                    <span className="text-xs text-rose-400 ml-1 font-bold">{caseData.currency || "AED"}</span>
                                </h4>
                            </div>
                            <div className="w-12 h-12 rounded-[20px] bg-rose-50 flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-rose-600" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-[20px] border border-gray-100 flex items-center justify-between gap-5 transition-all hover:border-emerald-100">
                            <div className="mx-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    {isRtl ? "إجمالي المحصل" : "Total Collected"}
                                </p>
                                <h4 className="text-xl font-black text-emerald-600 leading-tight">
                                    {totalCollected.toLocaleString(locale)}
                                    <span className="text-xs text-emerald-400 ml-1 font-bold">{caseData.currency || "AED"}</span>
                                </h4>
                            </div>
                            <div className="w-12 h-12 rounded-[20px] bg-emerald-50 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("amount")}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("transactionType")}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("transactionDate")}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tCommon("actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((ex) => (
                                    <tr key={ex.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors", ex.category === 'collection' ? "bg-emerald-50" : "bg-rose-50")}>
                                                    <DollarSign className={cn("w-4 h-4", ex.category === 'collection' ? "text-emerald-600" : "text-rose-600")} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn("text-[12px] font-black uppercase tracking-wider", ex.category === 'collection' ? "text-emerald-600" : "text-rose-600")}>
                                                        {ex.category === 'collection' ? "+" : "-"}{ex.amount?.toLocaleString(locale)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ex.currency || caseData.currency || "AED"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none", ex.category === 'collection' ? "!bg-emerald-100 !text-emerald-700" : "!bg-rose-100 !text-rose-700")}>
                                                    {ex.category === 'collection' ? (isRtl ? "تحصيل" : "Collection") : (isRtl ? "مصروف" : "Expense")}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {ex.expenseType === 'other'
                                                        ? (ex.customExpenseType || t("other"))
                                                        : t(getTranslationKey(ex.expenseType))}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {ex.expenseDate ? new Date(ex.expenseDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setViewingExpense(ex)}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit?.(ex)}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all duration-300"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete?.(ex)}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
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
                </div>
            </UniversalTabSection>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingExpense}
                onClose={() => setViewingExpense(null)}
                title={t("viewFinancial")}
                className="!max-w-[450px]"
            >
                {viewingExpense && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", viewingExpense.category === 'collection' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 leading-none">
                                    {viewingExpense.amount?.toLocaleString(locale)}
                                    <span className="text-sm text-gray-400 font-bold mx-1">{viewingExpense.currency || caseData.currency}</span>
                                </h3>
                                <Badge className={cn("mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border-none", viewingExpense.category === 'collection' ? "!bg-emerald-100 !text-emerald-700" : "!bg-rose-100 !text-rose-700")}>
                                    {viewingExpense.category === 'collection' ? (isRtl ? "تحصيل" : "Collection") : (isRtl ? "مصروف" : "Expense")}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("type")}</p>
                                    <p className="text-[13px] font-bold text-gray-900">
                                        {viewingExpense.expenseType === 'other'
                                            ? (viewingExpense.customExpenseType || t("other"))
                                            : t(getTranslationKey(viewingExpense.expenseType))}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("expenseDate")}</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <p className="text-[13px] font-bold text-gray-900 ltr:font-mono">
                                            {new Date(viewingExpense.expenseDate).toLocaleDateString(locale)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("description")}</p>
                                <p className="text-[13px] font-medium text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 min-h-[60px]">
                                    {viewingExpense.description || "---"}
                                </p>
                            </div>

                            {viewingExpense.attachmentUrl && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("receiptUrl")}</p>
                                    <a href={viewingExpense.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                        <Receipt className="w-4 h-4" />
                                        <span className="text-[12px] font-bold underline truncate">{viewingExpense.attachmentUrl}</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setViewingExpense(null)}
                                className="px-10 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                            >
                                {tCommon("close")}
                            </ModalButton>
                        </div>
                    </div>
                )}
            </Modal>
        </React.Fragment>
    );
}
