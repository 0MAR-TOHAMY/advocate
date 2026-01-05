"use client";

import { FileText, Eye, Download, Info, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ModalButton from "@/components/ui/ModalButton";
import { UniversalTabSection } from "./UniversalTabSection";

interface CaseDocumentsTabProps {
    documents: any[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    typeFilter: string;
    onTypeFilterChange: (value: string) => void;
    tDocs: any;
    tCommon: any;
    onView: (doc: any) => void;
    onUpload: () => void;
    onEdit?: (doc: any) => void;
    onDelete?: (doc: any) => void;
    locale: string;
    members?: any[];
    // Restored Pagination Props
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    loading?: boolean;
}

export function CaseDocumentsTab({
    documents,
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    tDocs,
    tCommon,
    onView,
    onUpload,
    onEdit,
    onDelete,
    locale,
    members = [],
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange,
    loading = false
}: CaseDocumentsTabProps) {
    const isRtl = locale === "ar";

    const getTypeColor = (type: string) => {
        switch (type) {
            case "contract": return "!bg-blue-100 !text-blue-500";
            case "pleading": return "!bg-purple-100 !text-purple-500";
            case "judgment": return "!bg-red-100 !text-red-500";
            case "evidence": return "!bg-amber-100 !text-amber-500";
            case "correspondence": return "!bg-emerald-100 !text-emerald-500";
            default: return "!bg-gray-100 !text-gray-500";
        }
    };

    const getCreatorName = (id: string) => {
        const member = members.find(m => m.id === id);
        return member ? member.name : id || "-";
    };

    return (
        <UniversalTabSection
            title={tDocs("title")}
            icon={FileText}
            count={totalCount || documents.length}
            countLabel={isRtl ? "مستندات" : "Documents"}
            addButtonLabel={tDocs("newDocument")}
            onAdd={onUpload}
            data={documents}
            loading={loading}
            isRtl={isRtl}
            colorScheme="indigo"
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            tipTitle={isRtl ? "نصيحة إدارة المستندات" : "Document Management Tip"}
            tipDescription={isRtl
                ? "يمكنك سحب وإفلات الملفات مباشرة لرفعها. يتم تشفير جميع المستندات وتخزينها بأمان لضمان الخصوصية."
                : "You can drag and drop files directly to upload. All documents are encrypted and safely stored to ensure privacy."}
        >
            <table className="w-full text-start">
                <thead>
                    <tr className="border-b border-gray-50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tDocs("fileName")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tDocs("type")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "بواسطة" : "Created By"}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{tDocs("date")}</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tDocs("actions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((doc) => (
                        <tr key={doc.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 leading-tight">{doc.title}</p>
                                        <p className="text-xs font-medium text-gray-400 mt-0.5">{doc.filename}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <Badge className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none ${getTypeColor(doc.documentType)}`}>
                                    {tDocs(`types.${doc.documentType}`)}
                                </Badge>
                            </td>
                            <td className="px-8 py-4">
                                <span className="text-xs font-bold text-gray-600">
                                    {doc.creatorName || getCreatorName(doc.uploadedBy)}
                                </span>
                            </td>
                            <td className="px-8 py-4">
                                <span className="text-sm font-bold text-gray-600">
                                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"}
                                </span>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onView(doc)}
                                        className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all duration-300"
                                        title={tCommon("view")}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <a
                                        href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}&name=${encodeURIComponent(doc.filename || doc.title || "document")}`}
                                        className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all duration-300"
                                        title={tCommon("download")}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(doc)}
                                            className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-all duration-300"
                                            title={tCommon("edit")}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(doc)}
                                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all duration-300"
                                            title={tCommon("delete")}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </UniversalTabSection>
    );
}


const isRtl = false; // This is a placeholder, it should be derived from context or props if needed
