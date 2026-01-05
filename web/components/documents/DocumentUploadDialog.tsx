/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import DateTimeInput from "@/components/ui/DateTimeInput";
import Select from "@/components/ui/Select";
import FileUpload from "@/components/ui/FileUpload";
import Modal from "@/components/ui/Modal";
import AlertModal from "@/components/ui/AlertModal";
import LoadingModal from "@/components/ui/LoadingModal";
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
import { Label } from "@/components/ui/Label";
import { useParams } from "next/navigation";

interface DocumentUploadDialogProps {
    open: boolean;
    onClose: () => void;
    onUpload: (formData: FormData) => Promise<void>;
    caseId?: string; // Pre-selected case
}

export default function DocumentUploadDialog({
    open,
    onClose,
    onUpload,
    caseId,
}: DocumentUploadDialogProps) {
    const t = useTranslations("documents");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [cases, setCases] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        documentType: "",
        caseId: caseId || "",
        documentDate: "",
    });
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error" | "info">("info");
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (open && !caseId) {
            fetchCases();
        }
    }, [open, caseId]);

    useEffect(() => {
        if (caseId) {
            setFormData(prev => ({ ...prev, caseId }));
        }
    }, [caseId]);

    const fetchCases = async () => {
        try {
            const response = await fetch("/api/cases?pageSize=100");
            if (response.ok) {
                const data = await response.json();
                setCases(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
            setCases([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setAlertType("info");
            setAlertMessage(tCommon("selectFile"));
            setAlertOpen(true);
            return;
        }

        if (!formData.caseId) {
            setAlertType("info");
            setAlertMessage(t("caseName") + " " + (locale === "ar" ? "مطلوب" : "Required"));
            setAlertOpen(true);
            return;
        }

        setUploading(true);

        try {
            const data = new FormData();
            data.append("file", file);
            data.append("caseId", formData.caseId);
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("documentType", formData.documentType);
            if (formData.documentDate) {
                data.append("documentDate", formData.documentDate);
            }

            await onUpload(data);

            // Reset form
            setFile(null);
            setFormData({
                title: "",
                description: "",
                documentType: "other",
                caseId: caseId || "",
                documentDate: "",
            });

            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            setAlertType("error");
            setAlertMessage(tCommon("error"));
            setAlertOpen(true);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setFile(null);
            setFormData({
                title: "",
                description: "",
                documentType: "other",
                caseId: caseId || "",
                documentDate: "",
            });
            onClose();
        }
    };

    const documentTypes = [
        "memorandum",
        "document",
        "notification",
        "expert_report",
        "other",
    ];

    return (
        <>
            <Modal
                isOpen={open}
                onClose={handleClose}
                title={t("newDocument")}
                className="sm:max-w-[500px]"
            >
                <div className="relative">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* File Upload */}
                        <div className="space-y-2">
                            <FileUpload
                                file={file}
                                onChange={(f) => { setFile(f); if (f && !formData.title) setFormData({ ...formData, title: f.name }); }}
                                disabled={uploading}
                                accept={"*/*"}
                                locale={locale}
                                label={locale === "ar" ? "اسحب وافلت الملف هنا أو اضغط للاختيار" : "Drag & drop a file here, or click to select"}
                            />
                        </div>

                        {/* Case Selection (if not pre-selected) */}
                        {!caseId && (
                            <div className="space-y-1.5">
                                <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{locale === "ar" ? "القضية" : "Case"}</Label>
                                <Select
                                    value={formData.caseId}
                                    onChange={(v) => setFormData({ ...formData, caseId: v })}
                                    options={[
                                        { value: "", label: locale === "ar" ? "اختر القضية *" : "Select Case *" },
                                        ...(Array.isArray(cases) ? cases : []).map((c: any) => ({ value: c.id, label: `${c.title} (${c.caseNumber || c.internalReferenceNumber || ""})` }))
                                    ]}
                                    className="w-full h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                                />
                            </div>
                        )}

                        {/* Document Type */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("type")}</Label>
                            <Select
                                value={formData.documentType}
                                onChange={(v) => setFormData({ ...formData, documentType: v })}
                                options={[
                                    { value: "", label: locale === "ar" ? "اختر نوع الوثيقة *" : "Select Document Type *" },
                                    ...documentTypes.map((type) => ({ value: type, label: t(`types.${type}`) }))
                                ]}
                                className="w-full h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("title")}</Label>
                            <Input
                                id="title"
                                placeholder={locale === "ar" ? "اكتب عنوان الوثيقة *" : "Enter document title *"}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                disabled={uploading}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</Label>
                            <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
                                <Textarea
                                    id="description"
                                    placeholder={locale === "ar" ? "اكتب وصف الوثيقة" : "Enter document description"}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={uploading}
                                    rows={3}
                                    className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
                                />
                            </div>
                        </div>

                        {/* Document Date */}
                        <div className="space-y-2">
                            <DateTimeInput
                                placeholder={locale === "ar" ? "اختر تاريخ الوثيقة" : "Select document date"}
                                value={formData.documentDate}
                                onChange={(v) => setFormData({ ...formData, documentDate: v })}
                                disabled={uploading}
                                locale={locale}
                                className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                            <ModalButton
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                disabled={uploading}
                                className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                {tCommon("cancel")}
                            </ModalButton>
                            <ModalButton
                                className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                type="submit"
                                disabled={uploading || !file}
                                loading={uploading}
                            >
                                {tCommon("save")}
                            </ModalButton>
                        </div>
                    </form>
                    <LoadingModal isOpen={uploading} message={tCommon("upload")} />
                </div>
            </Modal>
            <AlertModal isOpen={alertOpen} type={alertType} message={alertMessage} onClose={() => setAlertOpen(false)} />
        </>
    );
}
