/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    Search,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileSpreadsheet,
    FileArchive,
    FileCode,
    File,
    Download,
    Eye,
    ArrowLeft,
    ArrowRight,
    HardDrive,
    FolderOpen,
    Lock,
    PieChart,
    Briefcase,
    Calendar as CalendarIcon,
    User,
} from "lucide-react";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import DocumentViewer from "@/components/documents/DocumentViewer";
import EmptyState from "@/components/ui/EmptyState";
import ModalButton from "@/components/ui/ModalButton";
import { useAuth } from "@/contexts/AuthContext";

type Document = {
    id: string;
    title: string;
    filename: string;
    documentType: string;
    fileUrl: string;
    fileSize: number;
    createdAt: string;
    caseTitle?: string;
    caseId?: string;
    clientName?: string;
    uploadedBy?: string;
    uploaderName?: string;
    context?: string; // 'case' | 'hearing' | 'client'
};

export default function DocumentsPage() {
    const t = useTranslations("documents");
    const tCommon = useTranslations("common");
    const params = useParams();
    const router = useRouter();
    const locale = params?.locale as string || "en";
    const isRtl = locale === "ar";
    const { user } = useAuth();

    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [contextFilter, setContextFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [total, setTotal] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerTitle, setViewerTitle] = useState<string | undefined>(undefined);
    const [viewerMime, setViewerMime] = useState<string | undefined>(undefined);

    // Storage stats
    const [totalStorage, setTotalStorage] = useState(0);
    const [storageByType, setStorageByType] = useState<Record<string, number>>({});

    // Check permissions - only users with documents:view_all can access
    const hasAccess = user?.permissions?.includes("documents:view_all");

    useEffect(() => {
        if (!hasAccess) {
            router.push(`/${locale}/dashboard`);
            return;
        }
        fetchDocuments();
    }, [typeFilter, contextFilter, searchQuery, page, pageSize, sort, order, hasAccess]);

    const fetchDocuments = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (typeFilter !== "all") params.append("type", typeFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("page", String(page));
            params.append("pageSize", String(pageSize));
            params.append("sort", sort);
            params.append("order", order);

            const response = await fetch(`/api/documents?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.items || data);
                setTotal(data.total || 0);

                // Calculate storage stats
                const docs = data.items || data;
                const totalBytes = docs.reduce((acc: number, d: Document) => acc + (d.fileSize || 0), 0);
                setTotalStorage(totalBytes);

                const byType: Record<string, number> = {};
                docs.forEach((d: Document) => {
                    const type = d.documentType || 'other';
                    byType[type] = (byType[type] || 0) + (d.fileSize || 0);
                });
                setStorageByType(byType);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        const units = [tCommon("units.bytes"), tCommon("units.kb"), tCommon("units.mb"), tCommon("units.gb")];
        if (!bytes || bytes === 0) return `0 ${units[0]}`;
        const k = 1024;
        const i = Math.min(3, Math.floor(Math.log(bytes) / Math.log(k)));
        const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${value} ${units[i]}`;
    };

    const getFileIcon = (filename: string) => {
        const ext = String(filename || "").split(".").pop()?.toLowerCase() || "";
        const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
        const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
        const isAudio = ["mp3", "wav", "flac", "m4a", "aac"].includes(ext);
        const isSheet = ["xls", "xlsx", "csv"].includes(ext);
        const isArchive = ["zip", "rar", "7z", "tar", "gz"].includes(ext);
        const isCode = ["js", "ts", "tsx", "json", "html", "css", "py", "java"].includes(ext);
        const isPdf = ext === "pdf";
        const isDoc = ["doc", "docx", "rtf", "ppt", "pptx"].includes(ext);

        if (isImage) return { Icon: FileImage, color: "text-orange-400", bgColor: "bg-orange-50" };
        if (isVideo) return { Icon: FileVideo, color: "text-indigo-400", bgColor: "bg-indigo-50" };
        if (isAudio) return { Icon: FileAudio, color: "text-fuchsia-400", bgColor: "bg-fuchsia-50" };
        if (isSheet) return { Icon: FileSpreadsheet, color: "text-emerald-400", bgColor: "bg-emerald-50" };
        if (isArchive) return { Icon: FileArchive, color: "text-amber-400", bgColor: "bg-amber-50" };
        if (isCode) return { Icon: FileCode, color: "text-cyan-400", bgColor: "bg-cyan-50" };
        if (isPdf) return { Icon: FileText, color: "text-red-400", bgColor: "bg-red-50" };
        if (isDoc) return { Icon: FileText, color: "text-blue-400", bgColor: "bg-blue-50" };
        return { Icon: File, color: "text-gray-400", bgColor: "bg-gray-50" };
    };

    const documentTypes = ["memorandum", "document", "notification", "expert_report", "other"];

    // Permission check UI
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Lock className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                    {isRtl ? "غير مصرح بالوصول" : "Access Denied"}
                </h2>
                <p className="text-gray-500">
                    {isRtl ? "ليس لديك صلاحية الوصول إلى هذه الصفحة" : "You don't have permission to access this page"}
                </p>
            </div>
        );
    }

    const capacityValue = user?.maxStorageBytes ? parseInt(user.maxStorageBytes) : 0;
    const isUnlimited = capacityValue === 0 || capacityValue > 1000 * 1024 * 1024 * 1024; // 0 or > 1TB = Unlimited
    const displayUsage = user?.storageUsedBytes ? parseInt(user.storageUsedBytes) : totalStorage;
    const usagePercent = isUnlimited ? 0 : Math.min(100, (displayUsage / capacityValue) * 100);
    const usageColor = isUnlimited ? 'bg-blue-500' : usagePercent < 50 ? 'bg-green-500' : usagePercent < 80 ? 'bg-blue-500' : 'bg-red-500';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[24px] font-bold text-gray-900 flex items-center gap-2">
                            <HardDrive className="h-6 w-6 text-blue-500" />
                            {isRtl ? "إدارة المستندات" : "Document Management"}
                        </h1>
                        <p className="text-gray-500 text-[14px]">
                            {isRtl ? "عرض جميع مستندات المكتب وإحصائيات المساحة" : "View all firm documents and storage statistics"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Lock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                            {isRtl ? "للمشرفين فقط" : "Admin Only"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Storage Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Total Storage Card */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-blue-500" />
                            {isRtl ? "المساحة الإجمالية" : "Total Storage"}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900">{formatFileSize(displayUsage)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                        {isUnlimited ? (
                            isRtl ? "مساحة غير محدودة" : "Unlimited Storage"
                        ) : (
                            <>
                                {isRtl ? "من" : "of"} {formatFileSize(capacityValue)}
                            </>
                        )}
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${usageColor} transition-all ${isUnlimited ? 'opacity-30' : ''}`} style={{ width: isUnlimited ? '100%' : `${usagePercent}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        {isUnlimited ? (
                            isRtl ? "سعة تخزينية مفتوحة" : "Open Storage Capacity"
                        ) : (
                            `${usagePercent.toFixed(1)}% ${isRtl ? "مستخدم" : "used"}`
                        )}
                    </div>
                </div>

                {/* Documents Count Card */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-green-500" />
                            {isRtl ? "عدد المستندات" : "Total Documents"}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900">{total}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {isRtl ? "في جميع القضايا والجلسات" : "Across all cases and hearings"}
                    </div>
                </div>

                {/* Average Size Card */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            {isRtl ? "متوسط الحجم" : "Average Size"}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900">
                            {total > 0 ? formatFileSize(totalStorage / total) : "0"}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {isRtl ? "لكل مستند" : "Per document"}
                    </div>
                </div>
            </div>

            {/* Storage by Type */}
            {Object.keys(storageByType).length > 0 && (
                <div className="bg-white rounded-[24px] border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">
                        {isRtl ? "المساحة حسب النوع" : "Storage by Type"}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {Object.entries(storageByType).map(([type, size]) => (
                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">{t(`types.${type}`)}</span>
                                <span className="text-sm font-bold text-gray-800">{formatFileSize(size)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="bg-white rounded-[24px] border border-gray-100">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${isRtl ? "right-3" : "left-3"}`} />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className={`h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 ${isRtl ? "pr-10" : "pl-10"}`}
                            />
                        </div>
                        <Select
                            value={typeFilter}
                            onChange={(v) => { setTypeFilter(v); setPage(1); }}
                            options={[{ value: "all", label: t("allTypes") }, ...documentTypes.map((type) => ({ value: type, label: t(`types.${type}`) }))]}
                            className="w-full sm:w-[180px]"
                        />
                    </div>
                </div>
            </div>

            {/* Documents List (Read-Only) */}
            {isLoading ? (
                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
                    <Loader className="py-12" />
                </div>
            ) : documents && documents.length > 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase cursor-pointer" onClick={() => { setSort("title"); setOrder(order === "asc" ? "desc" : "asc"); }}>
                                        {t("fileName")}
                                    </th>
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase">
                                        <div className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {isRtl ? "القضية" : "Case"}
                                        </div>
                                    </th>
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase">{t("type")}</th>
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase cursor-pointer" onClick={() => { setSort("fileSize"); setOrder(order === "asc" ? "desc" : "asc"); }}>
                                        {t("size")}
                                    </th>
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase cursor-pointer" onClick={() => { setSort("createdAt"); setOrder(order === "asc" ? "desc" : "asc"); }}>
                                        {t("date")}
                                    </th>
                                    <th className="text-start p-4 text-[12px] font-semibold text-gray-600 uppercase">
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {isRtl ? "رُفع بواسطة" : "Uploaded By"}
                                        </div>
                                    </th>
                                    <th className="text-center p-4 text-[12px] font-semibold text-gray-600 uppercase">{t("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {documents.map((doc) => {
                                    const { Icon, color, bgColor } = getFileIcon(doc.filename);
                                    return (
                                        <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 rounded-lg ${bgColor}`}>
                                                        <Icon className={`h-4 w-4 ${color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{doc.title}</p>
                                                        <p className="text-xs text-gray-400">{doc.filename}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {doc.caseId ? (
                                                    <span className="text-sm text-gray-700">{doc.caseTitle || "-"}</span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {t(`types.${doc.documentType}`)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 text-sm font-medium">
                                                {formatFileSize(doc.fileSize)}
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {new Date(doc.createdAt).toLocaleDateString(locale)}
                                            </td>
                                            <td className="p-4 text-gray-600 text-sm">
                                                {doc.uploaderName || doc.uploadedBy || "-"}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                        onClick={() => { setViewerUrl(doc.fileUrl); setViewerTitle(doc.title); setViewerMime((doc as any).mimeType); setViewerOpen(true); }}
                                                    >
                                                        <Eye className="h-3 w-3" />{isRtl ? "عرض" : "View"}
                                                    </button>
                                                    <a
                                                        href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}&name=${encodeURIComponent(doc.filename)}`}
                                                        className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                                                    >
                                                        <Download className="h-3 w-3" />{isRtl ? "تحميل" : "Download"}
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<FileText className="h-12 w-12 text-gray-400" />}
                    title={t("noDocuments")}
                    description={t("noDocumentsMessage")}
                />
            )}

            <DocumentViewer open={viewerOpen} onClose={() => setViewerOpen(false)} url={viewerUrl} title={viewerTitle} mimeType={viewerMime} />

            {/* Pagination */}
            <div className="bg-white p-4 px-6 rounded-[24px] border border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">{tCommon("showing")} {documents.length} {tCommon("of")} {total}</div>
                <div className="flex items-center gap-2">
                    <ModalButton className="min-h-7! w-7 p-0!" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                        {isRtl ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
                    </ModalButton>
                    <span className="text-sm text-gray-700">{tCommon("page")}: {page}</span>
                    <ModalButton className="min-h-7! w-7 p-0!" variant="outline" onClick={() => setPage(page + 1)} disabled={documents.length < pageSize}>
                        {isRtl ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                    </ModalButton>
                </div>
            </div>
        </div>
    );
}
