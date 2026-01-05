/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import { ArrowLeft, CalendarDays, Clock, MapPin, Link2, FileText, Tag, Users, User } from "lucide-react";

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
  caseId?: string | null;
  reminderMinutes?: number | null;
  attendees?: string | any[] | null;
  createdBy?: string | null;
  assignedTo?: string | null;
};

export default function EventPreviewPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const tCommon = useTranslations("common");
  const tCal = useTranslations("calendar");
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data || null);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  function format(dt?: string | Date | null) {
    if (!dt) return "-";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  }

  const backHref = `/${locale}/dashboard/calendar/${event?.caseId ? "public" : "private"}`;

  function typeBadgeColor() {
    const t = (event?.eventType || "").toLowerCase();
    if (t === "deadline") return "bg-amber-100 text-amber-700";
    if (t === "consultation") return "bg-purple-100 text-purple-700";
    if (t === "meeting") return "bg-teal-100 text-teal-700";
    return "bg-gray-100 text-gray-700";
  }

  function statusBadgeColor() {
    const s = (event?.status || "").toLowerCase();
    if (s === "scheduled") return "bg-blue-100 text-blue-700";
    if (s === "canceled") return "bg-red-100 text-red-700";
    if (s === "done" || s === "completed") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  }

  function tType() {
    const key = (event?.eventType || "").toLowerCase();
    return key ? (tCal(`eventTypes.${key}`) || event?.eventType) : "";
  }

  function tStatus() {
    const key = (event?.status || "").toLowerCase();
    return key ? (tCal(`statuses.${key}`) || (event?.status || "")) : "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={backHref} className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {event?.caseId ? tCal("publicTitle") : tCal("privateTitle")}
        </Link>
      </div>

      <div className="rounded-[25px] overflow-hidden">
        {loading || !event ? (
          <div className="py-16 flex justify-center"><Loader /></div>
        ) : (
          <>
            <div className="bg-gray-100 p-6 text-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{event.title}</h1>
                  <div className="flex gap-2 mt-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${typeBadgeColor()}`}>{tType()}</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${statusBadgeColor()}`}>{tStatus()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={async () => { setDeleting(true); try { const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" }); if (res.ok) { location.href = backHref; } } finally { setDeleting(false); } }} disabled={deleting}>{tCommon("delete")}</Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 bg-white">
              {event.description ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2"><FileText className="h-4 w-4" />{tCommon("description")}</div>
                  <div className="text-sm text-gray-800 leading-relaxed">{event.description}</div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><CalendarDays className="h-4 w-4" />{tCal("fields.start")}</div>
                  <div className="text-sm text-gray-900">{format(event.startTime)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Clock className="h-4 w-4" />{tCal("fields.end")}</div>
                  <div className="text-sm text-gray-900">{format(event.endTime || null)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Tag className="h-4 w-4" />{tCal("statuses.label")}</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${statusBadgeColor()}`}>{tStatus()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><MapPin className="h-4 w-4" />{tCal("fields.location")}</div>
                  <div className="text-sm text-gray-900">{event.location || "-"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Link2 className="h-4 w-4" />{tCal("fields.meetingLink")}</div>
                  {event.meetingLink ? (
                    <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline break-all">{event.meetingLink}</a>
                  ) : (
                    <div className="text-sm text-gray-900">-</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Clock className="h-4 w-4" />{tCal("fields.allDay")}</div>
                  <div className="text-sm text-gray-900">{event.allDay ? tCommon("yes") : tCommon("no")}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Clock className="h-4 w-4" />{tCal("fields.reminder")}</div>
                  <div className="text-sm text-gray-900">{typeof event.reminderMinutes === "number" ? `${event.reminderMinutes} min` : "-"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><Users className="h-4 w-4" />{tCal("fields.attendees")}</div>
                  <div className="text-sm text-gray-900">
                    {(() => {
                      try {
                        const arr = Array.isArray(event.attendees) ? event.attendees : JSON.parse(event.attendees || "[]");
                        if (!arr || arr.length === 0) return "-";
                        return arr.join(", ");
                      } catch { return "-"; }
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><User className="h-4 w-4" />{locale === "ar" ? "أنشأ بواسطة" : "Created By"}</div>
                  <div className="text-sm text-gray-900">{event.createdBy || "-"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1"><User className="h-4 w-4" />{locale === "ar" ? "مكلف" : "Assigned To"}</div>
                  <div className="text-sm text-gray-900">{event.assignedTo || "-"}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
