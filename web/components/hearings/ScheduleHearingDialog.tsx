/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
import Input from "@/components/ui/Input";
import DateTimeInput from "@/components/ui/DateTimeInput";
import Select from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import {
  Calendar, MapPin, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
  caseId?: string | null;
  caseTitle?: string | null;
  hearing?: any; // For edit mode
};

export default function ScheduleHearingDialog({ open, onClose, onScheduled, caseId, caseTitle, hearing }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const t = useTranslations("hearings");
  const tCommon = useTranslations("common");
  const tCases = useTranslations("cases");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [hearingType, setHearingType] = useState("offline");
  const [stage, setStage] = useState("first_instance");
  const [court, setCourt] = useState("");
  const [judge, setJudge] = useState("");
  const [notes, setNotes] = useState("");
  const [summaryToClient, setSummaryToClient] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [showInClientPortal, setShowInClientPortal] = useState(false);
  const [hasJudgment, setHasJudgment] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState<{ value: string; label: string }[]>([]);

  const [cases, setCases] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    if (open) {
      if (hearing) {
        setTitle(hearing.comments || "");
        setDate(hearing.hearingDate ? new Date(hearing.hearingDate).toISOString() : "");
        setHearingType(hearing.hearingType || "offline");
        setStage(hearing.stage || "first_instance");
        setNotes(hearing.summaryByLawyer || "");
        setCourt(hearing.court || "");
        setJudge(hearing.judge || "");
        setNotes(hearing.summaryByLawyer || "");
        setSummaryToClient(hearing.summaryToClient || "");
        setTimeSpent(hearing.timeSpent || "");
        setShowInClientPortal(hearing.showInClientPortal || false);
        setHasJudgment(hearing.hasJudgment || false);
        setAssignedTo(hearing.assignedTo || "");
        setSelectedCaseId(hearing.caseId);
      } else {
        setTitle("");
        setDate("");
        setHearingType("offline");
        setStage("first_instance");
        setCourt("");
        setJudge("");
        setNotes("");
        setSummaryToClient("");
        setTimeSpent("");
        setShowInClientPortal(false);
        setHasJudgment(false);
        setAssignedTo("");
        if (caseId) setSelectedCaseId(caseId); else setSelectedCaseId("");
      }
    }
  }, [open, hearing, caseId]);

  useEffect(() => {
    if (open && !caseId && !hearing) {
      setLoadingCases(true);
      fetch("/api/cases?pageSize=100")
        .then((res) => res.json())
        .then((data) => {
          const items = data.items || [];
          setCases(items.map((c: any) => ({
            value: c.id,
            label: `${c.caseNumber} - ${c.title}`
          })));
        })
        .catch(console.error)
        .finally(() => setLoadingCases(false));

      // Fetch team members
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          const firmId = data.user?.firmId;
          if (firmId) {
            return fetch(`/api/firms/${firmId}/members`);
          }
          return Promise.reject("No firmId");
        })
        .then((res) => res.json())
        .then((data) => {
          const items = data.members || [];
          setMembers(items.map((m: any) => ({
            value: m.id,
            label: m.name
          })));
        })
        .catch(console.error);
    } else if (caseId) {
      setSelectedCaseId(caseId);
    }
  }, [open, caseId, hearing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !title || !date) return;

    setSaving(true);
    try {
      const url = `/api/hearings`;
      const method = hearing ? "PATCH" : "POST";
      const body: any = {
        title,
        caseId: selectedCaseId,
        hearingDate: new Date(date).toISOString(),
        hearingType,
        stage,
        court,
        judge,
        notes,
        summaryToClient,
        timeSpent,
        showInClientPortal,
        hasJudgment,
        assignedTo: assignedTo || null,
        status: "scheduled"
      };

      if (hearing) {
        body.id = hearing.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onClose();
        onScheduled && onScheduled();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("schedule")}
      className="max-w-[500px]"
    >

      <form className="space-y-4 w-full" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.title")}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={isRtl ? "مثلاً: جلسة النطق بالحكم" : "e.g. Judgment Pronunciation Session"}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("case")}</Label>
            {caseId ? (
              <div className="h-[55px] flex items-center px-4 rounded-xl bg-gray-50/50 border border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-tight truncate">
                <Briefcase className={cn("h-3.5 w-3.5 opacity-50", isRtl ? "ml-2" : "mr-2")} />
                {caseTitle || "Selected Case"}
              </div>
            ) : (
              <Select
                options={cases}
                value={selectedCaseId}
                onChange={setSelectedCaseId}
                placeholder={loadingCases ? tCommon("loading") : t("selectCase")}
                className="h-12 rounded-xl bg-gray-50/50 border-gray-100"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.type")}</Label>
            <Select
              options={[
                { value: "offline", label: t("types.offline") },
                { value: "online", label: t("types.online") },
              ]}
              value={hearingType}
              onChange={setHearingType}
              className="h-12 rounded-xl bg-gray-50/50 border-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("stage")}</Label>
            <Select
              options={[
                { value: "first_instance", label: tCases("stages.first_instance") },
                { value: "appeal", label: tCases("stages.appeal") },
                { value: "cassation", label: tCases("stages.cassation") },
                { value: "execution", label: tCases("stages.execution") },
                { value: "other", label: tCases("stages.other") },
              ]}
              value={stage}
              onChange={setStage}
              className="h-12 rounded-xl bg-gray-50/50 border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRtl ? "المحكمة" : "Court"}</Label>
            <Input
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              placeholder={isRtl ? "اسم المحكمة..." : "Court name..."}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.judge")}</Label>
            <Input
              value={judge}
              onChange={(e) => setJudge(e.target.value)}
              placeholder={isRtl ? "اسم القاضي..." : "Judge name..."}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.assignedTo")}</Label>
            <Select
              options={members}
              value={assignedTo}
              onChange={setAssignedTo}
              placeholder={isRtl ? "اختر محامي..." : "Select lawyer..."}
              className="h-12 rounded-xl bg-gray-50/50 border-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.timeSpent")}</Label>
            <Input
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder={isRtl ? "مثلاً: ساعة واحدة" : "e.g. 1 hour"}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.summaryToClient")}</Label>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
            <Textarea
              value={summaryToClient}
              onChange={(e) => setSummaryToClient(e.target.value)}
              placeholder={isRtl ? "ما يراه العميل..." : "Visible to client..."}
              rows={2}
              className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("fields.notes")}</Label>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden focus-within:bg-white transition-all">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notes")}
              rows={2}
              className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 px-2 py-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showInClientPortal}
              onChange={(e) => setShowInClientPortal(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[12px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
              {t("fields.showInClientPortal")}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={hasJudgment}
              onChange={(e) => setHasJudgment(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[12px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
              {t("fields.hasJudgment")}
            </span>
          </label>
        </div>



        <div className="space-y-2">
          <DateTimeInput
            locale={locale}
            value={date}
            onChange={setDate}
            placeholder={t("fields.date")}
            className="[&>div>div]:!h-12 [&>div>div]:!rounded-xl"
          />
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
            disabled={saving || (!selectedCaseId && !caseId) || !title || !date}
            loading={saving}
          >
            {tCommon("save")}
          </ModalButton>
        </div>
      </form>
    </Modal>
  );
}
