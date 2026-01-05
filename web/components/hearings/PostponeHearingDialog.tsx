"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import ModalButton from "@/components/ui/ModalButton";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";

interface PostponeHearingDialogProps {
  open: boolean;
  onClose: () => void;
  hearing: any;
  onPostponed: () => void;
}

export default function PostponeHearingDialog({
  open,
  onClose,
  hearing,
  onPostponed,
}: PostponeHearingDialogProps) {
  const t = useTranslations("hearings");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !hearing) return;

    setSaving(true);
    try {
      const res = await fetch("/api/hearings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: hearing.id,
          isPostponed: true,
          postponedDate: new Date(date).toISOString(),
          postponementReason: reason,
        }),
      });

      if (res.ok) {
        setDate("");
        setReason("");
        onClose();
        onPostponed();
      }
    } catch (error) {
      console.error("Postpone error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t("postponeTitle")}>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("newDate")}</Label>
          <DateTimeInput
            value={date}
            onChange={setDate}
            locale={locale}
            placeholder={t("newDate")}
            className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "سبب التأجيل" : "Postponement Reason"}</Label>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("postponeReasonPlaceholder")}
              rows={3}
              className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
          <ModalButton
            type="button"
            variant="ghost"
            onClick={onClose}
            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            {tCommon("cancel")}
          </ModalButton>
          <ModalButton
            className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            type="submit"
            disabled={saving || !date}
            loading={saving}
          >
            {tCommon("save")}
          </ModalButton>
        </div>
      </form>
    </Modal>
  );
}
