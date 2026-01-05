/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import DateTimeInput from "@/components/ui/DateTimeInput";
import AlertModal from "@/components/ui/AlertModal";
import { useTranslations } from "next-intl";
import Loader from "../ui/Loader";
import ModalButton from "@/components/ui/ModalButton";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  eventType?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
  allDay?: boolean;
  status?: string;
  caseTitle?: string | null;
  caseNumber?: string | null;
};

export default function EventDetailModal({ open, onClose, eventId, initialEvent, onChanged }: { open: boolean; onClose: () => void; eventId?: string | null; initialEvent?: Event | null; onChanged?: () => void; }) {
  const tCommon = useTranslations("common");
  const tCal = useTranslations("calendar");
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(initialEvent || null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data || null);
        }
      } finally {
        setLoading(false);
      }
    }
    if (open && eventId && !initialEvent) load();
  }, [open, eventId, initialEvent]);

  useEffect(() => {
    if (initialEvent) setEvent(initialEvent);
  }, [initialEvent]);

  function formatInputDate(dt?: string | Date | null) {
    if (!dt) return "";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${DD}T${hh}:${mm}`;
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={event?.title || "Event"}> 
      {loading || !event ? (
        <Loader/>
      ) : (
        <>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!event!.title?.trim() || !event!.startTime) {
              setAlertMessage("Please provide title and start time");
              setAlertOpen(true);
              return;
            }
            setSaving(true);
            try {
              const res = await fetch(`/api/events/${event!.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: event!.title,
                  description: event!.description || null,
                  location: event!.location || null,
                  meetingLink: event!.meetingLink || null,
                  startTime: event!.startTime ? new Date(event!.startTime as any) : null,
                  endTime: event!.endTime ? new Date(event!.endTime as any) : null,
                  status: event!.status || "scheduled",
                }),
              });
              if (res.ok) {
                onChanged && onChanged();
                onClose();
              }
            } finally {
              setSaving(false);
            }
          }}
        >
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCommon("title")}</label>
                <Input value={event.title} onChange={(e) => setEvent({ ...(event as Event), title: (e.target as any).value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCommon("description")}</label>
                <Textarea value={event.description || ""} onChange={(e) => setEvent({ ...(event as Event), description: (e.target as any).value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCal("fields.location")}</label>
                <Input value={event.location || ""} onChange={(e) => setEvent({ ...(event as Event), location: (e.target as any).value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCal("fields.meetingLink")}</label>
                <Input value={event.meetingLink || ""} onChange={(e) => setEvent({ ...(event as Event), meetingLink: (e.target as any).value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCal("fields.start")}</label>
                <DateTimeInput value={formatInputDate(event.startTime)} onChange={(v) => setEvent({ ...(event as Event), startTime: v })} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{tCal("fields.end")}</label>
                <DateTimeInput value={formatInputDate(event.endTime || null)} onChange={(v) => setEvent({ ...(event as Event), endTime: v })} />
              </div>
            {event.caseTitle ? (
              <div className="text-xs text-gray-700">{event.caseTitle} • {event.caseNumber || ""}</div>
            ) : null}
          </div>

            <div className="flex justify-between pt-3">
              <ModalButton type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</ModalButton>
              <div className="flex items-center gap-2">
              <ModalButton type="button" variant="outline" color="red" disabled={deleting} onClick={async () => {
                setDeleting(true);
                try {
                  const res = await fetch(`/api/events/${event!.id}`, { method: "DELETE" });
                  if (res.ok) { onChanged && onChanged(); onClose(); }
                } finally { setDeleting(false); }
              }}>{tCommon("delete")}</ModalButton>
              <ModalButton type="submit" className="flex-1" color="blue" disabled={saving}>{tCommon("save")} {saving && <Loader className="inline-block w-4 h-4" />}</ModalButton>
              </div>
            </div>
        </form>
        <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
        </>
      )}
    </Modal>
  );
}
