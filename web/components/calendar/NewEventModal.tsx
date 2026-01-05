"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
import Input from "@/components/ui/Input";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import AlertModal from "@/components/ui/AlertModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function NewEventModal({ open, onClose, onCreated }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [caseId, setCaseId] = useState<string>("");
  const [cases, setCases] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [eventType, setEventType] = useState("meeting");

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("/api/cases?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          setCases(items);
        }
      } catch {}
    }
    if (open) loadCases();
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onClose} title={t("addEvent")}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !start) {
            setAlertMessage(locale === "ar" ? "أدخل العنوان والوقت" : "Please provide title and start time");
            setAlertOpen(true);
            return;
          }
          setSaving(true);
          try {
            await fetch(`/api/events`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description: description || null,
                location: location || null,
                meetingLink: meetingLink || null,
                startTime: new Date(start),
                endTime: end ? new Date(end) : null,
                allDay,
                eventType,
                caseId: caseId || null,
                status: "scheduled",
              }),
            });
            setTitle("");
            setStart("");
            setEnd("");
            setDescription("");
            setLocation("");
            setMeetingLink("");
            setAllDay(false);
            setCaseId("");
            onClose();
            onCreated && onCreated();
          } finally {
            setSaving(false);
          }
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle((e.target as any).value)}
          placeholder={locale === "ar" ? "عنوان الحدث" : "Event title"}
          required
        />
        <Textarea value={description} onChange={(e) => setDescription((e.target as any).value)} placeholder={locale === "ar" ? "الوصف" : "Description"} rows={3} />
        <Input value={location} onChange={(e) => setLocation((e.target as any).value)} placeholder={locale === "ar" ? "الموقع" : "Location"} />
        <Input value={meetingLink} onChange={(e) => setMeetingLink((e.target as any).value)} placeholder={locale === "ar" ? "رابط الاجتماع" : "Meeting link"} />
        <DateTimeInput
          value={start}
          onChange={(v) => setStart(v)}
          locale={locale}
        />
        <DateTimeInput
          value={end}
          onChange={(v) => setEnd(v)}
          locale={locale}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700">{locale === "ar" ? "طوال اليوم" : "All day"}</label>
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        </div>
        <Select
          value={eventType}
          onChange={(v) => setEventType(v)}
          options={[
            { value: "meeting", label: locale === "ar" ? "اجتماع" : "Meeting" },
            { value: "deadline", label: locale === "ar" ? "موعد نهائي" : "Deadline" },
            { value: "consultation", label: locale === "ar" ? "استشارة" : "Consultation" },
            { value: "other", label: locale === "ar" ? "أخرى" : "Other" },
          ]}
        />
        <Select
          value={caseId}
          onChange={(v) => setCaseId(v)}
          options={[{ value: "", label: locale === "ar" ? "بدون قضية" : "No case" }, ...cases.map((c) => ({ value: c.id, label: `${c.title} (${c.caseNumber || c.internalReferenceNumber || ""})` }))]}
        />
        <div className="flex justify-end gap-2 pt-2">
          <ModalButton type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</ModalButton>
          <ModalButton className="!flex-1" color="blue" type="submit" disabled={saving}>{tCommon("save")} {saving && <Loader className="inline-block w-4 h-4" />}</ModalButton>
        </div>
      </form>
      <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
    </Modal>
  );
}
