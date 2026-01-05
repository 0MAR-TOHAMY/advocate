/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Calendar, FileText, DollarSign, Gavel, Clock, AlertCircle, Eye, Phone, Mail, MapPin, Download, Zap, User, Scale, Activity } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { Badge } from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import { TabsContent } from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import ModalButton from "@/components/ui/ModalButton";
import ScheduleHearingDialog from "@/components/hearings/ScheduleHearingDialog";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import DocumentViewer from "@/components/documents/DocumentViewer";
import DocumentEditDialog from "@/components/documents/DocumentEditDialog";
import PostponeHearingDialog from "@/components/hearings/PostponeHearingDialog";
import Select from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import DateTimeInput from "@/components/ui/DateTimeInput";
import CaseJudgmentsSection from "@/components/cases/CaseJudgmentsSection";
import CaseTimeline from "@/components/cases/CaseTimeline";
import CaseUpdatesSection from "@/components/cases/CaseUpdatesSection";
import CaseNotesCard from "@/components/cases/CaseNotesCard";

// Premium Components
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { CaseDetailHeader } from "@/components/cases/CaseDetailHeader";
import { CaseOverviewTab } from "@/components/cases/tabs/CaseOverviewTab";
import { CaseDocumentsTab } from "@/components/cases/tabs/CaseDocumentsTab";
import { CaseHearingsTab } from "@/components/cases/tabs/CaseHearingsTab";
import { CaseFinancialsTab } from "@/components/cases/tabs/CaseFinancialsTab";
import CaseTasksTab from "@/components/cases/tabs/CaseTasksTab";
import CaseSecondaryPartiesTab from "@/components/cases/tabs/CaseSecondaryPartiesTab";
import { History, MessageSquare, Users } from "lucide-react";
import { useCase } from "@/components/cases/CaseContext";

export default function CaseDetailContent() {
    const t = useTranslations("cases");
    const tCommon = useTranslations("common");
    const tDocs = useTranslations("documents");
    const tHear = useTranslations("hearings");
    const params = useParams();
    const locale = params?.locale as string || "en";
    const id = params?.id as string;
    const isRtl = locale === "ar";
    const router = useRouter();

    const {
        caseData,
        documents,
        hearings,
        expenses,
        judgments,
        updates,
        tasks,
        members,
        documentsTotal,
        hearingsTotal,
        expensesTotal,
        tasksTotal,
        judgmentsTotal,
        updatesTotal,
        isLoading,
        isDocumentsLoading,
        isHearingsLoading,
        isExpensesLoading,
        isJudgmentsLoading,
        isUpdatesLoading,
        isTasksLoading,
        refreshCaseData,
        refreshDocuments,
        refreshHearings,
        refreshExpenses,
        refreshJudgments,
        refreshUpdates,
        refreshTasks,
        refreshAll
    } = useCase();

    const [activeTab, setActiveTab] = useState("overview");
    const [locked, setLocked] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [authError, setAuthError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openScheduleHearing, setOpenScheduleHearing] = useState(false);
    const [openUploadDocument, setOpenUploadDocument] = useState(false);
    const [openAddExpense, setOpenAddExpense] = useState(false);
    const [openAddTask, setOpenAddTask] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDate, setTaskDate] = useState("");
    const [taskDesc, setTaskDesc] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("expense");
    const [expenseType, setExpenseType] = useState("");
    const [customExpenseType, setCustomExpenseType] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("");
    const [expenseDate, setExpenseDate] = useState("");
    const [expenseDescription, setExpenseDescription] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [savingExpense, setSavingExpense] = useState(false);
    const [openChangeStatus, setOpenChangeStatus] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    // Pagination & Filter States
    const [tasksPage, setTasksPage] = useState(1);
    const [expensesPage, setExpensesPage] = useState(1);
    const [hearingsPage, setHearingsPage] = useState(1);
    const [documentsPage, setDocumentsPage] = useState(1);
    const [judgmentsPage, setJudgmentsPage] = useState(1); // Added
    const [updatesPage, setUpdatesPage] = useState(1); // Added

    // Edit/Delete States
    const [taskToEdit, setTaskToEdit] = useState<any>(null);
    const [taskToDelete, setTaskToDelete] = useState<any>(null);
    const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);

    const [expenseToEdit, setExpenseToEdit] = useState<any>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
    const [deleteExpenseOpen, setDeleteExpenseOpen] = useState(false);

    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [docSearchQuery, setDocSearchQuery] = useState("");
    const [docTypeFilter, setDocTypeFilter] = useState("all");
    const [docSort, setDocSort] = useState("createdAt");
    const [docOrder, setDocOrder] = useState<"asc" | "desc">("desc");
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerTitle, setViewerTitle] = useState<string | undefined>(undefined);
    const [viewerMime, setViewerMime] = useState<string | undefined>(undefined);
    const [editDocumentOpen, setEditDocumentOpen] = useState(false);
    const [documentToEdit, setDocumentToEdit] = useState<any>(null);
    const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<any>(null);
    const [isDeletingDocument, setIsDeletingDocument] = useState(false);

    // Hearings State
    const [editHearingOpen, setEditHearingOpen] = useState(false);
    const [hearingToEdit, setHearingToEdit] = useState<any>(null);
    const [postponeHearingOpen, setPostponeHearingOpen] = useState(false);
    const [hearingToPostpone, setHearingToPostpone] = useState<any>(null);
    const [deleteHearingOpen, setDeleteHearingOpen] = useState(false);
    const [hearingToDelete, setHearingToDelete] = useState<any>(null);
    const [isDeletingHearing, setIsDeletingHearing] = useState(false);

    const [hearSort, setHearSort] = useState("hearingDate");
    const [hearOrder, setHearOrder] = useState<"asc" | "desc">("desc");

    const [openAssign, setOpenAssign] = useState(false);
    const [assignUserId, setAssignUserId] = useState("");
    const [assignSaving, setAssignSaving] = useState(false);

    // Lock check
    useEffect(() => {
        if (caseData && caseData.hasPassword) {
            // Check if already verified? 
            // The original code set locked=true based on fetched data.
            // We should maintain this behavior. 
            // Ideally we'd have a local "unlocked" state.
            // But since caseData updates from context, we need to ensure we don't re-lock if user unlocked.
            // Actually original code setLocked(!!data.hasPassword) on fetch.
            // We can do proper check here.
            // Let's assume initially it is locked if hasPassword is true.
            setLocked(!!caseData.hasPassword);
        }
    }, [caseData?.hasPassword]);
    // Wait, if I setLocked here, unlocking it via setLocked(false) might be overridden by useEffect if caseData updates?
    // We should only set it once. 
    // Or better, let's keep it simple: defaulting to locked if password exists is safe.
    // If user unlocks, we won't refetch case unless they do something.
    // But if they navigation, caseData is fresh.

    // Filter effects - Calls refresh methods from context
    useEffect(() => {
        if (!caseData?.id) return;

        // Documents
        refreshDocuments({
            type: docTypeFilter !== "all" ? docTypeFilter : undefined,
            search: docSearchQuery || undefined,
            sort: docSort,
            order: docOrder,
            page: String(documentsPage),
            pageSize: "10"
        });

        // Hearings
        refreshHearings({
            sort: hearSort,
            order: hearOrder,
            page: String(hearingsPage),
            pageSize: "10"
        });

        // Expenses
        refreshExpenses({
            page: String(expensesPage),
            pageSize: "10"
        });

        // Tasks
        refreshTasks({
            page: String(tasksPage),
            pageSize: "10"
        });

        // Judgments
        refreshJudgments({
            page: String(judgmentsPage),
            pageSize: "10"
        });

        // Updates
        refreshUpdates({
            page: String(updatesPage),
            pageSize: "10"
        });

    }, [
        caseData?.id,
        docSearchQuery, docTypeFilter, docSort, docOrder, documentsPage,
        hearSort, hearOrder, hearingsPage,
        expensesPage,
        expensesPage,
        tasksPage,
        judgmentsPage, // Added
        updatesPage // Added
    ]);

    const handleDeleteCase = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.push(`/${locale}/dashboard/cases`);
                router.refresh();
            } else {
                console.error("Failed to delete case");
            }
        } catch (error) {
            console.error("Error deleting case:", error);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (isLoading && !caseData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!caseData && !isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-6 bg-white sm:min-w-[400px] shadow-[0_35px_35px_rgba(0,0,0,0.03)] rounded-[25px] flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-[20px] font-bold text-gray-900 mb-2">{locale === "ar" ? "القضية غير موجودة" : "Case Not Found"}</h2>
                    <p className="text-gray-500 text-[14px] max-w-[200px] mb-6">{locale === "ar" ? "القضية التي تبحث عنها غير موجودة أو تم حذفها." : "The case you are looking for does not exist or has been deleted."}</p>
                    <Link href={`/${locale}/dashboard/cases`}>
                        <ModalButton>
                            {t("backToCases")}
                        </ModalButton>
                    </Link>
                </div>
            </div>
        );
    }

    if (locked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-[500px] space-y-6 pb-12">
                    <div className="flex items-center justify-between">
                        <Link href={`/${locale}/dashboard/cases`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            {t("backToCases")}
                        </Link>
                    </div>
                    <div className="relative overflow-hidden rounded-[25px] bg-white shadow-[0_35px_35px_rgba(0,0,0,0.03)] flex items-center justify-center">
                        <div className="relative p-8">
                            <div className="flex flex-col items-start gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <h2 className="text-[22px] font-bold text-gray-900">{t("passwordProtected")}</h2>
                                            <p className="text-gray-600 text-[12px]">{locale === "ar" ? "هذه القضية محمية. أدخل كلمة المرور للوصول." : "This case is protected. Enter the password to access."}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-[420px]">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-4 mx-2">{t("enterPassword")}</label>
                                        <div className="relative">
                                            <PasswordInput
                                                value={passwordInput}
                                                onChange={(e) => setPasswordInput(e.target.value)}
                                                placeholder={t("casePassword") as unknown as string}
                                                className="bg-white border border-gray-200"
                                                onKeyDown={async (e) => {
                                                    if (e.key === "Enter") {
                                                        setAuthError("");
                                                        if (!passwordInput.trim()) { setAuthError(tCommon("error") as unknown as string); return; }
                                                        setVerifying(true);
                                                        try {
                                                            const res = await fetch(`/api/cases/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passwordInput }) });
                                                            if (res.ok) { setLocked(false); } else { setAuthError(locale === "ar" ? "كلمة المرور غير صحيحة" : "Incorrect password"); }
                                                        } finally { setVerifying(false); }
                                                    }
                                                }}
                                            />
                                        </div>
                                        {authError && <p className="text-red-600 text-xs mt-2">{authError}</p>}
                                        <div className="mt-4 flex items-center">
                                            <ModalButton
                                                onClick={async () => {
                                                    setAuthError("");
                                                    if (!passwordInput.trim()) { setAuthError(tCommon("error") as unknown as string); return; }
                                                    setVerifying(true);
                                                    try {
                                                        const res = await fetch(`/api/cases/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passwordInput }) });
                                                        if (res.ok) { setLocked(false); } else { setAuthError(locale === "ar" ? "كلمة المرور غير صحيحة" : "Incorrect password"); }
                                                    } finally { setVerifying(false); }
                                                }}
                                                disabled={verifying}
                                                className="flex-1 bg-brand-primary!"
                                                loading={verifying}
                                            >
                                                {locale === "ar" ? "تأكيد" : "Verify"}
                                            </ModalButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { value: "overview", label: t("overview"), icon: <History className="w-3.5 h-3.5" /> },
        { value: "documents", label: t("documents"), icon: <FileText className="w-3.5 h-3.5" /> },
        { value: "hearings", label: t("hearings"), icon: <Scale className="w-3.5 h-3.5" /> },
        { value: "judgments", label: locale === "ar" ? "الأحكام" : "Judgments", icon: <Gavel className="w-3.5 h-3.5" /> },
        { value: "updates", label: locale === "ar" ? "التحديثات" : "Updates", icon: <Zap className="w-3.5 h-3.5" /> },
        { value: "notes", label: locale === "ar" ? "الملاحظات" : "Notes", icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { value: "timeline", label: locale === "ar" ? "السجل الزمني" : "Timeline", icon: <Activity className="w-3.5 h-3.5" /> },
        { value: "parties", label: locale === "ar" ? "الأطراف الثانوية" : "Secondary Parties", icon: <Users className="w-3.5 h-3.5" /> },
        { value: "tasks", label: t("tasks"), icon: <Clock className="w-3.5 h-3.5" /> },
        { value: "expenses", label: locale === "ar" ? "الماليات" : "Financials", icon: <DollarSign className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="max-w-[1600px] mx-auto pb-20">
            <CaseDetailHeader
                caseData={caseData}
                locale={locale}
                t={t}
                onEdit={() => router.push(`/${locale}/dashboard/cases/${id}/edit`)}
                onAssign={() => { setAssignUserId(caseData.assignedTo || ""); setOpenAssign(true); }}
                onChangeStatus={() => { setNewStatus(caseData.status || ""); setOpenChangeStatus(true); }}
                onDelete={() => setShowDeleteConfirm(true)}
            />

            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title={locale === "ar" ? "حذف القضية" : t("deleteCase")}
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
                                {isRtl ? "حذف القضية هو إجراء دائم" : "Case delete is permanent"}
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                        {locale === "ar"
                            ? "هل أنت متأكد أنك تريد حذف هذه القضية؟ سيتم حذف جميع البيانات والملفات المتعلقة بها نهائياً."
                            : tCommon("areYouSureDelete") || "Are you sure you want to delete this case? All related data and files will be permanently lost."}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleDeleteCase}
                            loading={isDeleting}
                            className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                        >
                            {tCommon("delete")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>

            <div className="space-y-4">
                <PremiumTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={tabs}
                />

                <div className="relative">
                    <TabsContent value="overview" activeValue={activeTab}>
                        <CaseOverviewTab
                            caseData={caseData}
                            locale={locale}
                            t={t}
                            tCommon={tCommon}
                            members={members}
                            hearings={hearings}
                            expenses={expenses}
                            onScheduleHearing={() => setOpenScheduleHearing(true)}
                            onUploadDocument={() => setOpenUploadDocument(true)}
                            onAddExpense={() => setOpenAddExpense(true)}
                            onTabChange={setActiveTab}
                        />
                    </TabsContent>

                    <TabsContent value="documents" activeValue={activeTab}>
                        <CaseDocumentsTab
                            documents={documents}
                            searchQuery={docSearchQuery}
                            onSearchChange={(v: string) => {
                                setDocSearchQuery(v);
                                setDocumentsPage(1);
                            }}
                            typeFilter={docTypeFilter}
                            onTypeFilterChange={(v: string) => {
                                setDocTypeFilter(v);
                                setDocumentsPage(1);
                            }}
                            tDocs={tDocs}
                            tCommon={tCommon}
                            onView={(doc) => {
                                setViewerUrl(doc.fileUrl);
                                setViewerTitle(doc.title);
                                setViewerMime(doc.mimeType);
                                setViewerOpen(true);
                            }}
                            onUpload={() => setOpenUploadDocument(true)}
                            onEdit={(doc) => {
                                setDocumentToEdit(doc);
                                setEditDocumentOpen(true);
                            }}
                            onDelete={(doc) => {
                                setDocumentToDelete(doc);
                                setDeleteDocumentOpen(true);
                            }}
                            locale={locale}
                            members={members}
                            totalCount={documentsTotal}
                            currentPage={documentsPage}
                            pageSize={10}
                            onPageChange={(p) => setDocumentsPage(p)}
                            loading={isDocumentsLoading}
                        />
                        <DocumentViewer open={viewerOpen} onClose={() => setViewerOpen(false)} url={viewerUrl} title={viewerTitle} mimeType={viewerMime} />
                        <DocumentEditDialog
                            open={editDocumentOpen}
                            onClose={() => setEditDocumentOpen(false)}
                            document={documentToEdit}
                            onUpdate={refreshDocuments}
                        />
                        <Modal
                            isOpen={deleteDocumentOpen}
                            onClose={() => setDeleteDocumentOpen(false)}
                            title={isRtl ? "حذف المستند" : "Delete Document"}
                            className="!max-w-[400px]"
                        >
                            {/* Document Delete Modal Content */}
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
                                            {isRtl ? "سيتم حذف المستند ولا يمكن التراجع" : "Document delete is permanent"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                                    {tCommon("areYouSureDelete") || "Are you sure you want to delete this document?"}
                                </p>
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <ModalButton
                                        variant="ghost"
                                        onClick={() => setDeleteDocumentOpen(false)}
                                        disabled={isDeletingDocument}
                                        className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        {tCommon("cancel")}
                                    </ModalButton>
                                    <ModalButton
                                        onClick={async () => {
                                            if (!documentToDelete) return;
                                            setIsDeletingDocument(true);
                                            try {
                                                const res = await fetch(`/api/documents?id=${documentToDelete.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    refreshDocuments();
                                                    setDeleteDocumentOpen(false);
                                                }
                                            } catch (e) {
                                                console.error("Error deleting document", e);
                                            } finally {
                                                setIsDeletingDocument(false);
                                            }
                                        }}
                                        loading={isDeletingDocument}
                                        className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
                                        {tCommon("delete")}
                                    </ModalButton>
                                </div>
                            </div>
                        </Modal>
                    </TabsContent>

                    <TabsContent value="hearings" activeValue={activeTab}>
                        <CaseHearingsTab
                            hearings={hearings}
                            locale={locale}
                            t={t}
                            tHear={tHear}
                            tCommon={tCommon}
                            onSchedule={() => setOpenScheduleHearing(true)}
                            onEdit={(hearing) => {
                                setHearingToEdit(hearing);
                                setEditHearingOpen(true);
                            }}
                            onDelete={(hearing) => {
                                setHearingToDelete(hearing);
                                setDeleteHearingOpen(true);
                            }}
                            onPostpone={(hearing) => {
                                setHearingToPostpone(hearing);
                                setPostponeHearingOpen(true);
                            }}
                            totalCount={hearingsTotal}
                            currentPage={hearingsPage}
                            pageSize={10}
                            onPageChange={(p) => setHearingsPage(p)}
                            loading={isHearingsLoading}
                        />
                        <Modal isOpen={deleteHearingOpen} onClose={() => setDeleteHearingOpen(false)} title={locale === "ar" ? "حذف الجلسة" : "Delete Hearing"} className="!max-w-[400px]">
                            {/* Hearing Delete Modal Content */}
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
                                            {isRtl ? "سيتم حذف الجلسة ولا يمكن التراجع" : "Hearing delete is permanent"}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                                    {tCommon("areYouSureDelete") || "Are you sure you want to delete this hearing?"}
                                </p>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <ModalButton
                                        variant="ghost"
                                        onClick={() => setDeleteHearingOpen(false)}
                                        disabled={isDeletingHearing}
                                        className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        {tCommon("cancel")}
                                    </ModalButton>
                                    <ModalButton
                                        onClick={async () => {
                                            if (!hearingToDelete) return;
                                            setIsDeletingHearing(true);
                                            try {
                                                const res = await fetch(`/api/hearings?id=${hearingToDelete.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    refreshHearings();
                                                    setDeleteHearingOpen(false);
                                                }
                                            } catch (e) {
                                                console.error("Error deleting hearing", e);
                                            } finally {
                                                setIsDeletingHearing(false);
                                            }
                                        }}
                                        loading={isDeletingHearing}
                                        className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                    >
                                        {tCommon("delete")}
                                    </ModalButton>
                                </div>
                            </div>
                        </Modal>
                        <PostponeHearingDialog
                            open={postponeHearingOpen}
                            onClose={() => setPostponeHearingOpen(false)}
                            hearing={hearingToPostpone}
                            onPostponed={() => refreshHearings()}
                        />
                    </TabsContent>

                    <TabsContent value="judgments" activeValue={activeTab}>
                        <CaseJudgmentsSection
                            caseId={id}
                            onJudgmentAdded={refreshJudgments}
                            judgments={judgments}
                            loading={isJudgmentsLoading}
                            totalCount={judgmentsTotal} // Pass total
                            currentPage={judgmentsPage}
                            pageSize={10}
                            onPageChange={(p) => setJudgmentsPage(p)}
                        />
                    </TabsContent>

                    <TabsContent value="updates" activeValue={activeTab}>
                        <CaseUpdatesSection
                            caseId={id}
                            onUpdateAdded={refreshUpdates}
                            updates={updates}
                            loading={isUpdatesLoading}
                            totalCount={updatesTotal} // Pass total
                            currentPage={updatesPage}
                            pageSize={10}
                            onPageChange={(p) => setUpdatesPage(p)}
                        />
                    </TabsContent>

                    <TabsContent value="notes" activeValue={activeTab}>
                        <CaseNotesCard caseId={id} />
                    </TabsContent>

                    <TabsContent value="timeline" activeValue={activeTab}>
                        <CaseTimeline caseId={id} />
                    </TabsContent>

                    <TabsContent value="parties" activeValue={activeTab}>
                        <CaseSecondaryPartiesTab
                            caseData={caseData}
                            locale={locale}
                            t={t}
                            tCommon={tCommon}
                            onUpdate={refreshCaseData}
                        />
                    </TabsContent>

                    <TabsContent value="tasks" activeValue={activeTab}>
                        <CaseTasksTab
                            tasks={tasks}
                            locale={locale}
                            t={t}
                            tCommon={tCommon}
                            onAddTask={() => setOpenAddTask(true)}
                            onEdit={(task) => {
                                setTaskToEdit(task);
                                setOpenAddTask(true);
                                setTaskTitle(task.title);
                                setTaskDate(task.startTime ? new Date(task.startTime).toISOString() : "");
                                setTaskDesc(task.description || "");
                            }}
                            onDelete={(task) => {
                                setTaskToDelete(task);
                                setDeleteTaskOpen(true);
                            }}
                            totalCount={tasksTotal}
                            currentPage={tasksPage}
                            pageSize={10}
                            onPageChange={(p) => setTasksPage(p)}
                            loading={isTasksLoading}
                        />
                        <Modal
                            isOpen={deleteTaskOpen}
                            onClose={() => setDeleteTaskOpen(false)}
                            title={isRtl ? "حذف المهمة" : "Delete Task"}
                            className="!max-w-[400px]"
                        >
                            {/* Task Delete Modal */}
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
                                            {isRtl ? "سيتم حذف المهمة ولا يمكن التراجع" : "Task delete is permanent"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                                    {tCommon("areYouSureDelete") || "Are you sure you want to delete this task?"}
                                </p>
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <ModalButton
                                        variant="ghost"
                                        onClick={() => setDeleteTaskOpen(false)}
                                        className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        {tCommon("cancel")}
                                    </ModalButton>
                                    <ModalButton
                                        onClick={async () => {
                                            if (!taskToDelete) return;
                                            try {
                                                const res = await fetch(`/api/events?id=${taskToDelete.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    refreshTasks();
                                                    setDeleteTaskOpen(false);
                                                }
                                            } catch (e) {
                                                console.error("Error deleting task", e);
                                            }
                                        }}
                                        className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                    >
                                        {tCommon("delete")}
                                    </ModalButton>
                                </div>
                            </div>
                        </Modal>
                    </TabsContent>

                    <TabsContent value="expenses" activeValue={activeTab}>
                        <CaseFinancialsTab
                            expenses={expenses}
                            caseData={caseData}
                            locale={locale}
                            t={t}
                            tCommon={tCommon}
                            onAddExpense={() => setOpenAddExpense(true)}
                            onEdit={(ex) => {
                                setExpenseToEdit(ex);
                                setOpenAddExpense(true);
                                setExpenseCategory(ex.category);
                                setExpenseType(ex.expenseType);
                                setCustomExpenseType(ex.customExpenseType || "");
                                setAmount(String(ex.amount));
                                setCurrency(ex.currency || "");
                                setExpenseDate(ex.expenseDate ? new Date(ex.expenseDate).toISOString() : "");
                                setExpenseDescription(ex.description || "");
                            }}
                            onDelete={(ex) => {
                                setExpenseToDelete(ex);
                                setDeleteExpenseOpen(true);
                            }}
                            totalCount={expensesTotal}
                            currentPage={expensesPage}
                            pageSize={10}
                            onPageChange={(p) => setExpensesPage(p)}
                            loading={isExpensesLoading}
                        />
                        <Modal
                            isOpen={deleteExpenseOpen}
                            onClose={() => setDeleteExpenseOpen(false)}
                            title={isRtl ? "حذف المعاملة" : "Delete Transaction"}
                            className="!max-w-[400px]"
                        >
                            {/* Expense Delete Modal */}
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
                                            {isRtl ? "سيتم حذف المعاملة ولا يمكن التراجع" : "Transaction delete is permanent"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                                    {tCommon("areYouSureDelete") || "Are you sure you want to delete this transaction?"}
                                </p>
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <ModalButton
                                        variant="ghost"
                                        onClick={() => setDeleteExpenseOpen(false)}
                                        className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        {tCommon("cancel")}
                                    </ModalButton>
                                    <ModalButton
                                        onClick={async () => {
                                            if (!expenseToDelete) return;
                                            try {
                                                const res = await fetch(`/api/expenses?id=${expenseToDelete.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    refreshExpenses();
                                                    setDeleteExpenseOpen(false);
                                                }
                                            } catch (e) {
                                                console.error("Error deleting expense", e);
                                            }
                                        }}
                                        className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                    >
                                        {tCommon("delete")}
                                    </ModalButton>
                                </div>
                            </div>
                        </Modal>
                    </TabsContent>
                </div>
            </div>
            <ScheduleHearingDialog
                open={openScheduleHearing || editHearingOpen}
                onClose={() => {
                    setOpenScheduleHearing(false);
                    setEditHearingOpen(false);
                    setHearingToEdit(null);
                }}
                caseId={caseData.id}
                caseTitle={caseData.title}
                onScheduled={() => {
                    refreshHearings();
                    setEditHearingOpen(false);
                    setHearingToEdit(null);
                }}
                hearing={hearingToEdit}
            />
            <DocumentUploadDialog
                open={openUploadDocument}
                onClose={() => setOpenUploadDocument(false)}
                caseId={caseData.id}
                onUpload={async (fd) => {
                    const res = await fetch("/api/documents", { method: "POST", body: fd });
                    if (res.ok) {
                        refreshDocuments();
                    }
                }}
            />
            <Modal
                isOpen={openAddExpense}
                onClose={() => setOpenAddExpense(false)}
                title={t("recordExpense")}
                className="!max-w-[450px]"
            >
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!expenseType || !amount || !expenseDate) return;
                        setSavingExpense(true);
                        try {
                            const params = expenseToEdit ? `?id=${expenseToEdit.id}` : "";
                            const method = expenseToEdit ? "PATCH" : "POST";

                            const res = await fetch(`/api/expenses${params}`, {
                                method: method,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    caseId: caseData.id,
                                    expenseType,
                                    customExpenseType: customExpenseType || null,
                                    category: expenseCategory,
                                    amount: Number(amount),
                                    currency: currency || caseData.currency || "AED",
                                    description: expenseDescription || undefined,
                                    expenseDate: new Date(expenseDate),
                                    attachmentUrl: attachmentUrl || undefined,
                                }),
                            });
                            if (res.ok) {
                                setOpenAddExpense(false);
                                setExpenseCategory("expense");
                                setExpenseType("");
                                setCustomExpenseType("");
                                setAmount("");
                                setCurrency("");
                                setExpenseDate("");
                                setExpenseDescription("");
                                setAttachmentUrl("");
                                setExpenseToEdit(null);
                                refreshExpenses();
                            }
                        } finally {
                            setSavingExpense(false);
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("category")}</Label>
                            <Select
                                value={expenseCategory}
                                onChange={(v) => setExpenseCategory(v)}
                                options={[
                                    { value: "expense", label: t("expense") },
                                    { value: "collection", label: t("collection") }
                                ]}
                                className="w-full h-12 rounded-xl bg-gray-50/50 border-gray-100"
                                placeholder={t("selectCategory")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("type")}</Label>
                            <Select
                                value={expenseType}
                                onChange={(v) => setExpenseType(v)}
                                options={[
                                    { value: "filing_registration_fees", label: t("filingRegistrationFees") },
                                    { value: "expert_expenses", label: t("expertExpenses") },
                                    { value: "notification_expenses", label: t("notificationExpenses") },
                                    { value: "petition_expenses", label: t("petitionExpenses") },
                                    { value: "legal_notice_expenses", label: t("legalNoticeExpenses") },
                                    { value: "translation_fees", label: t("translationFees") },
                                    { value: "travel_expenses", label: t("travelExpenses") },
                                    { value: "witness_fees", label: t("witnessFees") },
                                    { value: "bailiff_enforcement_fees", label: t("bailiffEnforcementFees") },
                                    { value: "appeal_fees", label: t("appealFees") },
                                    { value: "consultation_fees", label: t("consultationFees") },
                                    { value: "court_transcript_fees", label: t("courtTranscriptFees") },
                                    { value: "document_preparation_fees", label: t("documentPreparationFees") },
                                    { value: "other", label: t("other") },
                                ]}
                                className="w-full h-12 rounded-xl bg-gray-50/50 border-gray-100"
                                placeholder={t("selectExpenseType")}
                            />
                        </div>
                    </div>

                    {expenseType === "other" && (
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("customExpenseType")}</Label>
                            <Input
                                value={customExpenseType}
                                onChange={(e) => setCustomExpenseType(e.target.value)}
                                placeholder={t("customExpenseType")}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("amount")}</Label>
                            <Input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("currency")}</Label>
                            <Input value={caseData.currency ?? "AED"} readOnly placeholder={caseData.currency || "AED"} disabled className="h-12 bg-gray-50 text-gray-400 rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("expenseDate")}</Label>
                        <DateTimeInput
                            value={expenseDate}
                            onChange={(v) => setExpenseDate(v)}
                            placeholder={t("expenseDate")}
                            locale={locale}
                            className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</Label>
                        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
                            <Textarea
                                value={expenseDescription}
                                onChange={(e) => setExpenseDescription(e.target.value)}
                                rows={3}
                                placeholder={t("description")}
                                className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium resize-none focus:!ring-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("receiptimage") || "Receipt File"}</Label>
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAttachmentUrl(file.name);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-12 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center px-4 gap-3 text-gray-400 group-hover:bg-gray-100 group-hover:border-indigo-200 transition-all">
                                <span className="text-xs font-medium truncate flex-1">
                                    {attachmentUrl ? attachmentUrl : (locale === "ar" ? "اضغط لرفع ملف الإيصال..." : "Click to upload receipt file...")}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setOpenAddExpense(false)}
                            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            type="submit"
                            disabled={savingExpense || !expenseType || !amount || !expenseDate}
                            loading={savingExpense}
                        >
                            {tCommon("save")}
                        </ModalButton>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={openAddTask}
                onClose={() => setOpenAddTask(false)}
                title={t("addTask")}
                className="!max-w-[450px]"
            >
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!taskTitle || !taskDate) return;
                        try {
                            const params = taskToEdit ? `?id=${taskToEdit.id}` : "";
                            const method = taskToEdit ? "PATCH" : "POST";
                            await fetch(`/api/events${params}`, {
                                method: method,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    caseId: caseData.id,
                                    title: taskTitle,
                                    description: taskDesc || undefined,
                                    eventType: "deadline",
                                    startTime: new Date(taskDate),
                                    status: "scheduled",
                                }),
                            });
                            setOpenAddTask(false);
                            setTaskTitle("");
                            setTaskDate("");
                            setTaskDesc("");
                            setTaskToEdit(null);
                            refreshTasks();
                        } catch { }
                    }}
                >
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "عنوان المهمة" : "Task Title"}</Label>
                            <Input
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder={locale === "ar" ? "مثلاً: تقديم المذكرة الجوابية" : "e.g. Submit responsive memo"}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "التاريخ المستهدف" : "Due Date"}</Label>
                            <DateTimeInput
                                locale={locale}
                                value={taskDate}
                                onChange={setTaskDate}
                                placeholder={locale === "ar" ? "تاريخ المهمة" : "Due Date"}
                                className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "التفاصيل" : "Details"}</Label>
                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
                                <Textarea
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    rows={3}
                                    placeholder={locale === "ar" ? "وصف المهمة..." : "Task description..."}
                                    className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium resize-none focus:!ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                        <ModalButton
                            type="button"
                            variant="ghost"
                            onClick={() => setOpenAddTask(false)}
                            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            type="submit"
                        >
                            {tCommon("save")}
                        </ModalButton>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={openChangeStatus}
                onClose={() => setOpenChangeStatus(false)}
                title={isRtl ? "تغيير حالة القضية" : "Change Case Status"}
                className="!max-w-[420px]"
            >
                <div className="space-y-6">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setUpdatingStatus(true);
                            try {
                                const res = await fetch(`/api/cases/${caseData.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: newStatus }),
                                });
                                if (res.ok) {
                                    refreshCaseData();
                                    setOpenChangeStatus(false);
                                }
                            } finally {
                                setUpdatingStatus(false);
                            }
                        }}
                    >
                        <div className="grid grid-cols-1 gap-2 mb-6">
                            {[
                                { value: "active", label: t("statuses.active"), dot: "bg-emerald-500", desc: isRtl ? "القضية قيد التداول حالياً" : "Case is currently active" },
                                { value: "pending", label: t("statuses.pending"), dot: "bg-amber-500", desc: isRtl ? "انتظار إجراء معين" : "Awaiting specific action" },
                                { value: "closed", label: t("statuses.closed"), dot: "bg-gray-400", desc: isRtl ? "تم إغلاق القضية نهائياً" : "Case is permanently closed" },
                                { value: "archived", label: t("statuses.archived"), dot: "bg-blue-500", desc: isRtl ? "نقل القضية للأرشيف" : "Move case to archive" },
                                { value: "decided", label: t("statuses.decided"), dot: "bg-rose-500", desc: isRtl ? "تم صدور الحكم" : "Judgment has been issued" },
                            ].map((opt) => (
                                <label
                                    key={opt.value}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group",
                                        newStatus === opt.value
                                            ? "bg-indigo-600/5 border-indigo-600/30 ring-1 ring-indigo-600/30"
                                            : "bg-white border-gray-100 hover:border-gray-200"
                                    )}
                                    onClick={() => setNewStatus(opt.value)}
                                >
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        newStatus === opt.value ? "border-indigo-600" : "border-gray-200"
                                    )}>
                                        {newStatus === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", opt.dot)} />
                                            <span className={cn("text-xs font-black uppercase tracking-wider", newStatus === opt.value ? "text-indigo-600" : "text-gray-900")}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{opt.desc}</p>
                                    </div>
                                    <input
                                        type="radio"
                                        name="case-status"
                                        value={opt.value}
                                        checked={newStatus === opt.value}
                                        onChange={() => setNewStatus(opt.value)}
                                        className="sr-only"
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                            <ModalButton type="button" variant="ghost" onClick={() => setOpenChangeStatus(false)} className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                                {tCommon("cancel")}
                            </ModalButton>
                            <ModalButton className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95" type="submit" disabled={updatingStatus || !newStatus} loading={updatingStatus}>
                                {tCommon("save")}
                            </ModalButton>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                isOpen={openAssign}
                onClose={() => setOpenAssign(false)}
                title={isRtl ? "تعيين عضو للقضية" : "Assign Case Member"}
                className="!max-w-[400px]"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="mx-2 uppercase text-[10px] font-black text-gray-400 tracking-widest">{isRtl ? "اختر العضو" : "Select Member"}</Label>
                            <Select
                                value={assignUserId}
                                onChange={(v) => setAssignUserId(v)}
                                options={[{ value: "", label: isRtl ? "لا يوجد تعيين (إزالة)" : "Unassigned (Remove)" }, ...members.map((m: any) => ({ value: m.userId, label: m.name }))]}
                                className="w-full h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setOpenAssign(false)}
                                className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                {tCommon("cancel")}
                            </ModalButton>
                            <ModalButton
                                className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                onClick={async () => {
                                    if (!caseData?.id) return;
                                    setAssignSaving(true);
                                    try {
                                        const res = await fetch(`/api/cases/${caseData.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo: assignUserId || null }) });
                                        if (res.ok) {
                                            refreshCaseData();
                                            setOpenAssign(false);
                                        }
                                    } finally {
                                        setAssignSaving(false);
                                    }
                                }}
                                loading={assignSaving}
                            >
                                {tCommon("save")}
                            </ModalButton>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
