/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import DateTimeInput from "@/components/ui/DateTimeInput";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import AlertModal from "@/components/ui/AlertModal";
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
import { Label } from "@/components/ui/Label";
import { useParams } from "next/navigation";

interface DocumentEditDialogProps {
    open: boolean;
    onClose: () => void;
    document: any;
    onUpdate: () => void;
}

export default function DocumentEditDialog({
    open,
    onClose,
    document,
    onUpdate,
}: DocumentEditDialogProps) {
    const t = useTranslations("documents");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        documentType: "",
        documentDate: "",
    });
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<"success" | "error" | "info">("info");
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (open && document) {
            setFormData({
                title: document.title || "",
                description: document.description || "",
                documentType: document.documentType || "other",
                documentDate: document.documentDate || "",
            });
        }
    }, [open, document]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSaving(true);
        try {
            const res = await fetch("/api/documents", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: document.id,
                    ...formData
                })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                throw new Error("Failed to update");
            }
        } catch (error) {
            console.error("Update error:", error);
            setAlertType("error");
            setAlertMessage(tCommon("error"));
            setAlertOpen(true);
        } finally {
            setSaving(false);
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
                onClose={onClose}
                title={tCommon("edit")}
                className="sm:max-w-[500px]"
            >
                <div className="relative">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("name")}</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                disabled={saving}
                                required
                                placeholder={t("name")}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        {/* Document Type */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("type")}</Label>
                            <Select
                                value={formData.documentType}
                                onChange={(v) => setFormData({ ...formData, documentType: v })}
                                options={documentTypes.map((type) => ({ value: type, label: t(`types.${type}`) }))}
                                className="w-full h-12 rounded-xl bg-gray-50/50 border-gray-100"
                                placeholder={t("type")}
                            />
                        </div>

                        {/* Document Date */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("date")}</Label>
                            <DateTimeInput
                                value={formData.documentDate}
                                onChange={(v) => setFormData({ ...formData, documentDate: v })}
                                disabled={saving}
                                locale={locale}
                                placeholder={t("date")}
                                className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("description")}</Label>
                            <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={saving}
                                    rows={3}
                                    placeholder={t("description")}
                                    className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                            <ModalButton
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={saving}
                                className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                {tCommon("cancel")}
                            </ModalButton>
                            <ModalButton
                                className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                type="submit"
                                disabled={saving}
                                loading={saving}
                            >
                                {tCommon("save")}
                            </ModalButton>
                        </div>
                    </form>
                </div>
            </Modal>
            <AlertModal isOpen={alertOpen} type={alertType} message={alertMessage} onClose={() => setAlertOpen(false)} />
        </>
    );
}
