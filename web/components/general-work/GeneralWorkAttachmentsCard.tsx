/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    FileText, Download, Trash2, Upload,
    Loader2, ExternalLink, Paperclip
} from "lucide-react";
import Button from "@/components/ui/Button";
import GeneralWorkAttachmentUploadDialog from "./GeneralWorkAttachmentUploadDialog"; // Ensure this component is compatible
import { Badge } from "@/components/ui/Badge";
import AlertModal from "@/components/ui/AlertModal";
import { cn } from "@/lib/utils";
import ModalButton from "@/components/ui/ModalButton";

interface GeneralWorkAttachmentsCardProps {
    workId: string;
}

export default function GeneralWorkAttachmentsCard({ workId }: GeneralWorkAttachmentsCardProps) {
    const t = useTranslations("generalWork"); // Fallback if specific keys needed, but mostly hardcoded in Hearing Card
    const tCommon = useTranslations("common");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [alert, setAlert] = useState<{ open: boolean; type: "success" | "error"; message: string }>({
        open: false,
        type: "success",
        message: "",
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null,
    });

    const isAr = typeof window !== "undefined" && document.documentElement.dir === "rtl";

    const fetchAttachments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/general-work/${workId}/documents`);
            if (res.ok) {
                const data = await res.json();
                setAttachments(data || []); // API returns array directly
            }
        } catch (error) {
            console.error("Error fetching attachments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttachments();
    }, [workId]);

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        const id = deleteConfirm.id;
        setDeleteConfirm({ open: false, id: null });

        try {
            const res = await fetch(`/api/general-work/${workId}/documents?documentId=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setAttachments(attachments.filter(a => a.id !== id));
                setAlert({
                    open: true,
                    type: "success",
                    message: isAr ? "تم الحذف بنجاح" : "Deleted successfully",
                });
            } else {
                throw new Error("Delete failed");
            }
        } catch (error: any) {
            setAlert({
                open: true,
                type: "error",
                message: error.message || tCommon("error"),
            });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.startsWith("image/")) return <ExternalLink className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    const getDownloadUrl = (file: any) => {
        // Use existing URL if absolute or server relative path
        if (file.fileUrl && (file.fileUrl.startsWith("http") || file.fileUrl.startsWith("/"))) {
            return file.fileUrl;
        }
        // Fallback for legacy keys
        return `/api/documents/download?key=${encodeURIComponent(file.fileUrl)}&name=${encodeURIComponent(file.title || file.fileName)}`;
    };

    return (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {isAr ? "المرفقات والوثائق" : "Attachments & Documents"}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                            {attachments.length} {isAr ? "ملفات مرفقة" : "Files Attached"}
                        </p>
                    </div>
                </div>

                <ModalButton
                    onClick={() => setUploadOpen(true)}
                    className="!h-10 !px-4 rounded-xl !bg-indigo-600 !text-white hover:shadow-lg transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                    <Upload className="w-3.5 h-3.5" />
                    {isAr ? "إضافة مرفق" : "Add Attachment"}
                </ModalButton>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-200" />
                </div>
            ) : attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((file) => (
                        <div key={file.id}
                            className="group flex flex-col p-5 bg-white border border-gray-100/50 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 rounded-2xl transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={cn("absolute top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity", isAr ? "left-0" : "right-0")}>
                                <div className="flex gap-1">
                                    <a
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        title={tCommon("download")}
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                    <button
                                        onClick={() => setDeleteConfirm({ open: true, id: file.id })}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title={tCommon("delete")}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all duration-300">
                                    {getFileIcon(file.mimeType)}
                                </div>
                                <div className={cn("flex-1 min-w-0", isAr ? "pl-16" : "pr-16")}>
                                    <p className="font-black text-gray-900 truncate text-sm mb-1">{file.title || file.fileName}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatFileSize(file.fileSize)}</p>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {new Date(file.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/20 group">
                    <div className="w-16 h-16 rounded-[32px] bg-white flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-gray-200" />
                    </div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{isAr ? "لا توجد مرفقات لهذا العمل" : "No attachments for this work"}</p>
                    <p className="text-[11px] font-bold text-gray-300 mt-2 max-w-[200px] mx-auto leading-relaxed">
                        {isAr ? "قم برفع المستندات والوثائق المتعلقة بالعمل هنا" : "Upload documents and records related to this work here"}
                    </p>
                </div>
            )}

            <GeneralWorkAttachmentUploadDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                workId={workId}
                onUploaded={() => {
                    // Refresh completely to ensure sorting or formatting
                    fetchAttachments();
                    setAlert({
                        open: true,
                        type: "success",
                        message: isAr ? "تم الرفع بنجاح" : "Uploaded successfully",
                    });
                }}
            />

            <AlertModal
                isOpen={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            <AlertModal
                isOpen={deleteConfirm.open}
                type="warning"
                title={tCommon("delete")}
                message={isAr ? "هل أنت متأكد من حذف هذا المرفق؟" : "Are you sure you want to delete this attachment?"}
                confirmText={tCommon("delete")}
                cancelText={tCommon("cancel")}
                onClose={() => setDeleteConfirm({ open: false, id: null })}
                onConfirm={handleDelete}
            />
        </div>
    );
}
