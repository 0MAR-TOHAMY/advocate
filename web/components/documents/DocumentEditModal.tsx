/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import DateTimeInput from "@/components/ui/DateTimeInput";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: string | null;
  onSaved?: () => void;
};

export default function DocumentEditModal({ open, onClose, documentId, onSaved }: Props) {
  const tCommon = useTranslations("common");
  const tDocs = useTranslations("documents");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const [documentDate, setDocumentDate] = useState("");

  useEffect(() => {
    async function load() {
      if (!documentId) return;
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}`);
      if (res.ok) {
        const d = await res.json();
        setTitle(d.title || "");
        setDescription(d.description || "");
        setDocumentType(d.documentType || "other");
        setDocumentDate(d.documentDate || "");
      }
      setLoading(false);
    }
    if (open && documentId) load();
  }, [open, documentId]);

  return (
    <Modal isOpen={open} onClose={onClose} className="sm:max-w-[520px]">
      <div className="space-y-3">
        <div className="text-[16px] font-bold text-gray-900">{tDocs("title")}</div>
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-600">{tCommon("loading")}</div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!documentId) return;
              setSaving(true);
              const res = await fetch(`/api/documents/${documentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, documentType, documentDate }),
              });
              setSaving(false);
              if (res.ok) { onSaved && onSaved(); onClose(); }
            }}
          >
            <Input value={title} onChange={(e) => setTitle((e.target as any).value)} placeholder={tCommon("title") || "Title"} />
            <Textarea rows={3} value={description} onChange={(e) => setDescription((e.target as any).value)} placeholder={tCommon("description") || "Description"} />
            <Select value={documentType} onChange={(v) => setDocumentType(v)} options={[
              { value: "memorandum", label: tDocs("types.memorandum") },
              { value: "document", label: tDocs("types.document") },
              { value: "notification", label: tDocs("types.notification") },
              { value: "expert_report", label: tDocs("types.expert_report") },
              { value: "other", label: tDocs("types.other") },
            ]} />
            <DateTimeInput value={documentDate} onChange={setDocumentDate} />
            <div className="flex justify-end gap-2 pt-2">
              <ModalButton type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</ModalButton>
              <ModalButton type="submit" className="flex-1" color="blue" disabled={saving}>{tCommon("save")} {saving && <Loader className="inline-block w-4 h-4" />}</ModalButton>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
