"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import DateTimeInput from "@/components/ui/DateTimeInput";
import Select from "@/components/ui/Select";
import AlertModal from "@/components/ui/AlertModal";

export default function NewCalendarEventPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const tCal = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const scope = (search?.get("scope") as "public" | "personal") || "personal";

  const [cases, setCases] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState("meeting");
  const [caseId, setCaseId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("/api/cases?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          setCases(data.items || data);
        }
      } catch {}
    }
    loadCases();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href={`/${locale}/dashboard/calendar/${scope === "public" ? "public" : "private"}`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {scope === "public" ? tCal("publicTitle") : tCal("privateTitle")}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{tCal("addEvent")}</h1>
        <p className="text-gray-600 mt-1">{locale === "ar" ? "إنشاء حدث جديد" : "Create a new event"}</p>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6" onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || !start) {
          setAlertMessage(locale === "ar" ? "أدخل العنوان والوقت" : "Please provide title and start time");
          setAlertOpen(true);
          return;
        }
        setSaving(true);
        try {
          const payload = {
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
          };
          const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (res.ok) {
            router.push(`/${locale}/dashboard/calendar/${scope === "public" ? "public" : "private"}`);
            router.refresh();
          } else {
            setAlertMessage(tCommon("error"));
            setAlertOpen(true);
          }
        } finally {
          setSaving(false);
        }
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title">{tCommon("title")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle((e.target as any).value)} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="eventType">{locale === "ar" ? "نوع الحدث" : "Event Type"}</Label>
            <Select value={eventType} onChange={(v) => setEventType(v)} options={[{ value: "meeting", label: locale === "ar" ? "اجتماع" : "Meeting" }, { value: "deadline", label: locale === "ar" ? "موعد نهائي" : "Deadline" }, { value: "consultation", label: locale === "ar" ? "استشارة" : "Consultation" }, { value: "other", label: locale === "ar" ? "أخرى" : "Other" }]} className="mt-1" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">{tCommon("description")}</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription((e.target as any).value)} rows={4} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="location">{locale === "ar" ? "الموقع" : "Location"}</Label>
            <Input id="location" value={location} onChange={(e) => setLocation((e.target as any).value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="meetingLink">{locale === "ar" ? "رابط الاجتماع" : "Meeting Link"}</Label>
            <Input id="meetingLink" value={meetingLink} onChange={(e) => setMeetingLink((e.target as any).value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="start">{locale === "ar" ? "يبدأ" : "Start"}</Label>
            <DateTimeInput value={start} onChange={(v) => setStart(v)} locale={locale} />
          </div>
          <div>
            <Label htmlFor="end">{locale === "ar" ? "ينتهي" : "End"}</Label>
            <DateTimeInput value={end} onChange={(v) => setEnd(v)} locale={locale} />
          </div>

          <div>
            <Label htmlFor="case">{locale === "ar" ? "القضية" : "Case"}</Label>
            <Select value={caseId} onChange={(v) => setCaseId(v)} options={[{ value: "", label: locale === "ar" ? "بدون قضية" : "No case" }, ...cases.map((c) => ({ value: c.id, label: `${c.title} (${c.caseNumber || c.internalReferenceNumber || ""})` }))]} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input id="allDay" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <Label htmlFor="allDay">{locale === "ar" ? "طوال اليوم" : "All day"}</Label>
          </div>
        </div>

        <div className="flex gap-3 justify-end border-t pt-6 mt-6">
          <Link href={`/${locale}/dashboard/calendar/${scope === "public" ? "public" : "private"}`}>
            <Button type="button" variant="outline">{tCommon("cancel")}</Button>
          </Link>
          <Button type="submit" loading={saving}>{tCommon("save")}</Button>
        </div>
      </form>

      <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
    </div>
  );
}
