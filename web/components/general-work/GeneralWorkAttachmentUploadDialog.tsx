"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import FileUpload from "@/components/ui/FileUpload";
import ModalButton from "@/components/ui/ModalButton";
import LoadingModal from "@/components/ui/LoadingModal";
import AlertModal from "@/components/ui/AlertModal";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/Label";

interface GeneralWorkAttachmentUploadDialogProps {
    open: boolean;
    onClose: () => void;
    workId: string;
    onUploaded: () => void;
}

export default function GeneralWorkAttachmentUploadDialog({
    open,
    onClose,
    workId,
    onUploaded,
}: GeneralWorkAttachmentUploadDialogProps) {
    const t = useTranslations("generalWork");
    const tCommon = useTranslations("common");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const isAr = locale === "ar";

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ open: boolean; type: "success" | "error"; message: string }>({
        open: false,
        type: "success",
        message: "",
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/general-work/${workId}/documents`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Upload failed");
            }

            onUploaded();
            setFile(null);
            onClose();
        } catch (error: any) {
            setAlert({
                open: true,
                type: "error",
                message: error.message || tCommon("error"),
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={open}
                onClose={onClose}
                title={isAr ? "إضافة مستند جديد" : "Add New Document"}
                className="sm:max-w-[500px]"
            >
                <div className="space-y-6">
                    <div>
                        <Label className="block text-sm font-bold text-gray-700 mb-2">{isAr ? "الملف" : "File"}</Label>
                        <FileUpload
                            file={file}
                            onChange={setFile}
                            disabled={uploading}
                            locale={locale}
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <ModalButton
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={uploading}
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            color="blue"
                            className="flex-1"
                            disabled={!file || uploading}
                            onClick={handleUpload}
                        >
                            {uploading ? tCommon("upload") + "..." : isAr ? "رفع" : "Upload"}
                        </ModalButton>
                    </div>
                </div>
            </Modal>

            <LoadingModal isOpen={uploading} message={tCommon("upload")} />
            <AlertModal
                isOpen={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </>
    );
}
