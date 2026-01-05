/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Loader from "@/components/ui/Loader";
// Removed modal preview in favor of dedicated preview page
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function PublicCalendarPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("calendar");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  async function moveEvent(id: string, toDate: Date) {
    try {
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      const from = new Date(ev.startTime);
      const newStart = new Date(toDate);
      newStart.setHours(from.getHours(), from.getMinutes(), 0, 0);
      await fetch(`/api/events/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startTime: newStart }) });
      const res = await fetch(`/api/events/public`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { }
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/events/public`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const weeks: Date[][] = [];
  let week: Date[] = [];
  for (let i = 0; i < startDay; i++) week.push(new Date(NaN));
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(current.getFullYear(), current.getMonth(), d));
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(new Date(NaN)); weeks.push(week); }

  const weekStart = (() => {
    const dt = new Date(current);
    const day = dt.getDay();
    const start = new Date(dt);
    start.setDate(dt.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => {
    const base = new Date(1970, 0, 4 + i);
    return base.toLocaleDateString(locale, { weekday: "short" });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">{t("publicTitle")}</h1>
          <p className="text-gray-500 text-[14px]">{t("publicSubtitle")}</p>
        </div>
        <Link href={`/${locale}/dashboard/calendar/new?scope=public`}>
          <Button className="px-6! py-2! text-[14px]!"><Plus className={`h-4 w-4 ${locale === "ar" ? "ml-2" : "mr-2"}`} />{t("addEvent")}</Button>
        </Link>
      </div>

      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px]">
        <div className="p-4">

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() =>
                  setCurrent(
                    view === "month"
                      ? new Date(current.getFullYear(), current.getMonth() - 1, 1)
                      : new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() =>
                  setCurrent(
                    view === "month"
                      ? new Date(current.getFullYear(), current.getMonth() + 1, 1)
                      : new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {view === "month"
                  ? current.toLocaleString(locale, { month: "long", year: "numeric" })
                  : `${weekStart.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md overflow-hidden border border-gray-200">
                <button
                  className={`text-xs px-3 py-2 ${view === "month" ? "bg-gray-100 text-gray-900" : "bg-white text-gray-700"}`}
                  onClick={() => setView("month")}
                >
                  {t("monthView")}
                </button>
                <button
                  className={`text-xs px-3 py-2 ${view === "week" ? "bg-gray-100 text-gray-900" : "bg-white text-gray-700"}`}
                  onClick={() => setView("week")}
                >
                  {t("weekView")}
                </button>
              </div>
              <a href="/api/events/ics?scope=public" className="text-xs px-3 py-2 rounded-md bg-brand-primary text-white hover:opacity-90 shadow-sm">{t("downloadICS") || "Download ICS"}</a>
            </div>
          </div>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader /></div>
          ) : (
            view === "month" ? (
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-md overflow-hidden">
                {weekdayHeaders.map((d) => (
                  <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600">{d}</div>
                ))}
                {weeks.flat().map((day, idx) => (
                  <div key={idx} className="bg-white min-h-[90px] p-2" onDragOver={(e) => { if (!isNaN(day.getTime())) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } }} onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/event-id") || e.dataTransfer.getData("text/plain");
                    if (id && !isNaN(day.getTime())) moveEvent(id, day);
                  }}>
                    {!isNaN(day.getTime()) && (
                      <div className="text-xs font-semibold text-gray-900">{day.getDate()}</div>
                    )}
                    <div className="mt-1 space-y-1">
                      {!isNaN(day.getTime()) && Array.isArray(events) && events.filter((ev) => {
                        const dt = new Date(ev.startTime);
                        return dt.getFullYear() === day.getFullYear() && dt.getMonth() === day.getMonth() && dt.getDate() === day.getDate();
                      }).map((ev) => (
                        <Link key={ev.id} href={`/${locale}/dashboard/calendar/events/${ev.id}`} draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/event-id", ev.id); e.dataTransfer.setData("text/plain", ev.id); }} className={`block cursor-move text-[10px] px-2 py-1 rounded-md ${ev.eventType === 'deadline' ? 'bg-orange-100 text-orange-700' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'} w-full text-left hover:opacity-90`}>
                          {ev.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {weekDays.map((day, idx) => (
                  <div key={idx} className="bg-white min-h-[120px] rounded-md border border-gray-200" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/event-id") || e.dataTransfer.getData("text/plain");
                    if (id) moveEvent(id, day);
                  }}>
                    <div className="bg-gray-50 border-b border-gray-200 rounded-t-md p-2 text-center text-xs font-semibold text-gray-600">
                      {day.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div className="mt-2 px-2 space-y-1">
                      {Array.isArray(events) && events.filter((ev) => {
                        const dt = new Date(ev.startTime);
                        return dt.getFullYear() === day.getFullYear() && dt.getMonth() === day.getMonth() && dt.getDate() === day.getDate();
                      }).map((ev) => (
                        <Link key={ev.id} href={`/${locale}/dashboard/calendar/events/${ev.id}`} draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/event-id", ev.id); e.dataTransfer.setData("text/plain", ev.id); }} className={`block cursor-move text-[10px] px-2 py-1 rounded-md ${ev.eventType === 'deadline' ? 'bg-orange-100 text-orange-700' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'} w-full text-left hover:opacity-90`}>
                          {ev.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
