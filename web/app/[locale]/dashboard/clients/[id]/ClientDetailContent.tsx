"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    Briefcase,
    FileText,
    User,
    Activity,
    Link as LinkIcon,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Plus,
    Search
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import AlertModal from "@/components/ui/AlertModal";
import { TabsContent } from "@/components/ui/Tabs";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { ClientDetailHeader } from "@/components/clients/ClientDetailHeader";
import { ClientOverviewTab } from "@/components/clients/tabs/ClientOverviewTab";
import { ClientCasesTab } from "@/components/clients/tabs/ClientCasesTab";
import { ClientDocumentsTab } from "@/components/clients/tabs/ClientDocumentsTab";
import { useClient } from "@/components/clients/ClientContext";
import ClientDocumentUploadDialog from "@/components/clients/ClientDocumentUploadDialog";
import DocumentViewer from "@/components/documents/DocumentViewer";
// import DocumentEditDialog from "@/components/documents/DocumentEditDialog"; // If we have one for client documents later


export default function ClientDetailContent() {
    const t = useTranslations("clients");
    const tCommon = useTranslations("common");
    const tCases = useTranslations("cases");
    const tDocs = useTranslations("documents");
    const params = useParams();
    const locale = params?.locale as string || "en";
    const id = params?.id as string;
    const isRtl = locale === "ar";
    const router = useRouter();

    const {
        client,
        clientCases,
        clientDocuments,
        clientCasesTotal,
        clientDocumentsTotal,
        isLoading,
        isCasesLoading,
        isDocumentsLoading,
        refreshCases,
        refreshDocuments,
        refreshAll
    } = useClient();

    const [activeTab, setActiveTab] = useState("overview");
    const [openUpload, setOpenUpload] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerTitle, setViewerTitle] = useState<string | undefined>(undefined);
    const [viewerMime, setViewerMime] = useState<string | undefined>(undefined);

    const [casesPage, setCasesPage] = useState(1);
    const [documentsPage, setDocumentsPage] = useState(1);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (activeTab === "cases") {
            refreshCases({ page: casesPage });
        }
    }, [casesPage, activeTab, refreshCases]);

    useEffect(() => {
        if (activeTab === "documents") {
            refreshDocuments({ page: documentsPage });
        }
    }, [documentsPage, activeTab, refreshDocuments]);

    const handleUpload = async (formData: FormData) => {
        try {
            const response = await fetch("/api/client-documents", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                refreshAll();
            }
        } catch (error) {
            console.error("Error uploading document:", error);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/clients/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.push(`/${locale}/dashboard/clients`);
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting client:", error);
        } finally {
            setIsDeleting(false);
            setDeleteAlertOpen(false);
        }
    };

    if (isLoading && !client) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-[32px] bg-gray-50 flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-gray-200" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">{t("clientNotFound")}</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t("clientNotFoundMessage") || "The client you are looking for does not exist or has been removed."}</p>
                <button
                    onClick={() => router.push(`/${locale}/dashboard/clients`)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {t("backToClients")}
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
            value: "cases",
            label: t("cases"),
            icon: <Briefcase className="w-4 h-4" />
        },
        {
            value: "documents",
            label: isRtl ? "المستندات" : "Documents",
            icon: <FileText className="w-4 h-4" />
        }
    ];

    const stats = {
        totalCases: clientCases.length,
        activeCases: clientCases.filter(c => c.status === "active").length,
        totalDocuments: clientDocuments.length
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <ClientDetailHeader
                client={client}
                locale={locale}
                t={t}
                onEdit={() => router.push(`/${locale}/dashboard/clients/${id}/edit`)}
                onDelete={() => setDeleteAlertOpen(true)}
            />

            <PremiumTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
                className="mb-6"
            />

            <div className="relative min-h-[500px]">
                <TabsContent value="overview" activeValue={activeTab}>
                    <ClientOverviewTab
                        client={client}
                        locale={locale}
                        t={t}
                        tCommon={tCommon}
                        stats={stats}
                        onAddCase={() => router.push(`/${locale}/dashboard/cases/new?clientId=${id}`)}
                        onUploadDocument={() => setOpenUpload(true)}
                        onTabChange={setActiveTab}
                    />
                </TabsContent>

                <TabsContent value="cases" activeValue={activeTab}>
                    <ClientCasesTab
                        cases={clientCases}
                        locale={locale}
                        t={tCases}
                        isLoading={isCasesLoading}
                        totalCount={clientCasesTotal}
                        currentPage={casesPage}
                        onPageChange={setCasesPage}
                    />
                </TabsContent>

                <TabsContent value="documents" activeValue={activeTab}>
                    <ClientDocumentsTab
                        documents={clientDocuments}
                        tDocs={tDocs}
                        tCommon={tCommon}
                        onView={(doc) => {
                            setViewerUrl(doc.fileUrl);
                            setViewerTitle(doc.title);
                            setViewerMime(doc.mimeType);
                            setViewerOpen(true);
                        }}
                        onUpload={() => setOpenUpload(true)}
                        locale={locale}
                        loading={isDocumentsLoading}
                        totalCount={clientDocumentsTotal}
                        currentPage={documentsPage}
                        onPageChange={setDocumentsPage}
                    />
                </TabsContent>
            </div>

            <ClientDocumentUploadDialog
                open={openUpload}
                onClose={() => setOpenUpload(false)}
                onUpload={handleUpload}
                clientId={id}
            />

            <DocumentViewer
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                url={viewerUrl}
                title={viewerTitle}
                mimeType={viewerMime}
            />

            <AlertModal
                isOpen={deleteAlertOpen}
                onClose={() => setDeleteAlertOpen(false)}
                onConfirm={handleDelete}
                title={t("deleteClient")}
                message={t("deleteConfirmMessage")}
                confirmText={isDeleting ? tCommon("loading") : tCommon("delete")}
                cancelText={tCommon("cancel")}
                type="warning"
            />
        </div>
    );
}
