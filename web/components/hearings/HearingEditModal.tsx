/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import Loader from "../ui/Loader";
import ModalButton from "@/components/ui/ModalButton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { Textarea } from "@/components/ui/Textarea";
import {
  Calendar, Clock, User, Briefcase,
  MapPin, Info, Layers, Scale, Building,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

type Hearing = {
  id: string;
  hearingDate: string | Date;
  hearingTime?: string | null;
  hearingType?: string | null;
  stage?: string | null;
  assignedTo?: string | null;
  comments?: string | null; // title
  summaryByLawyer?: string | null; // notes
  summaryToClient?: string | null;
  court?: string | null;
  judge?: string | null;
  timeSpent?: string | null;
  showInClientPortal?: boolean;
  hasJudgment?: boolean;
};

export default function HearingEditModal({ open, onClose, hearingId, initial, onSaved }: { open: boolean; onClose: () => void; hearingId: string | null; initial?: Hearing | null; onSaved?: () => void }) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const tCommon = useTranslations("common");
  const tHearings = useTranslations("hearings");
  const tCases = useTranslations("cases");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<Hearing | null>(initial || null);
  const [members, setMembers] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function load() {
      if (!hearingId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/hearings/${hearingId}`);
        if (res.ok) {
          const data = await res.json();
          setState(data.hearing || null);
        }
      } finally { setLoading(false); }
    }
    if (open && hearingId && !initial) load();

    // Fetch members
    if (open) {
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
    }
  }, [open, hearingId, initial]);

  function fmt(dt?: string | Date | null) {
    if (!dt) return "";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    return d.toISOString();
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={tHearings("editTitle")} className="p-0">
      {loading || !state ? (
        <div className="py-20 flex justify-center"><Loader /></div>
      ) : (
        <form
          className="space-y-3 w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const res = await fetch(`/api/hearings/${state.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  hearingDate: state.hearingDate ? new Date(state.hearingDate as any).toISOString() : null,
                  hearingType: state.hearingType || null,
                  stage: state.stage || null,
                  comments: state.comments || null,
                  summaryByLawyer: state.summaryByLawyer || null,
                  summaryToClient: state.summaryToClient || null,
                  court: state.court || null,
                  judge: state.judge || null,
                  assignedTo: state.assignedTo || null,
                  timeSpent: state.timeSpent || null,
                  showInClientPortal: state.showInClientPortal || false,
                  hasJudgment: state.hasJudgment || false,
                }),
              });
              if (res.ok) {
                onClose();
                onSaved && onSaved();
              }
            } finally { setSaving(false); }
          }}
        >
          {/* ROW 1: Title */}
          <div className="w-full">
            <Input
              value={state.comments || ""}
              onChange={(e) => setState({ ...state, comments: e.target.value })}
              required
              placeholder={tHearings("fields.title") + " *"}
              className="h-12 !text-[14px] font-bold w-full"
            />
          </div>

          {/* ROW 2: Type & Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              options={[
                { value: "offline", label: tHearings("types.offline") },
                { value: "online", label: tHearings("types.online") },
              ]}
              value={state.hearingType || "offline"}
              onChange={(v) => setState({ ...state, hearingType: v })}
              className="h-12 !text-[12px] font-bold text-gray-700"
            />
            <Select
              options={[
                { value: "first_instance", label: tCases("stages.first_instance") },
                { value: "appeal", label: tCases("stages.appeal") },
                { value: "cassation", label: tCases("stages.cassation") },
                { value: "execution", label: tCases("stages.execution") },
                { value: "other", label: tCases("stages.other") },
              ]}
              value={state.stage || "first_instance"}
              onChange={(v) => setState({ ...state, stage: v })}
              className="h-12 !text-[12px] font-bold text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative group">
              <Building className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
              <Input
                value={state.court || ""}
                onChange={(e) => setState({ ...state, court: e.target.value })}
                placeholder={isRtl ? "اسم المحكمة" : "Court Name"}
                className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
              />
            </div>
            <div className="relative group">
              <Scale className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
              <Input
                value={state.judge || ""}
                onChange={(e) => setState({ ...state, judge: e.target.value })}
                placeholder={isRtl ? "اسم القاضي" : "Judge Name"}
                className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative group">
              <User className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
              <Select
                options={members}
                value={state.assignedTo || ""}
                onChange={(v) => setState({ ...state, assignedTo: v })}
                placeholder={tHearings("fields.assignedTo")}
                className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
              />
            </div>
            <div className="relative group">
              <Clock className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
              <Input
                value={state.timeSpent || ""}
                onChange={(e) => setState({ ...state, timeSpent: e.target.value })}
                placeholder={tHearings("fields.timeSpent")}
                className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
              />
            </div>
          </div>

          <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
            <Textarea
              value={state.summaryToClient || ""}
              onChange={(e) => setState({ ...state, summaryToClient: e.target.value })}
              rows={2}
              placeholder={tHearings("fields.summaryToClient")}
              className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 px-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={state.showInClientPortal}
                onChange={(e) => setState({ ...state, showInClientPortal: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-[12px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                {tHearings("fields.showInClientPortal")}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={state.hasJudgment}
                onChange={(e) => setState({ ...state, hasJudgment: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-[12px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                {tHearings("fields.hasJudgment")}
              </span>
            </label>
          </div>

          <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
            <Textarea
              value={state.summaryByLawyer || ""}
              onChange={(e) => setState({ ...state, summaryByLawyer: e.target.value })}
              rows={2}
              placeholder={tHearings("fields.notes")}
              className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
            />
          </div>

          {/* ROW 5: Timing */}
          <div className="">
            <DateTimeInput
              value={fmt(state.hearingDate)}
              onChange={(v) => setState({ ...state, hearingDate: v })}
              placeholder={tHearings("fields.date")}
              className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[55px] [&>div>div]:!py-2 [&>div>div]:!border-none [&>div>div]:!shadow-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <ModalButton
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-8 h-12 rounded-xl font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              {tCommon("cancel")}
            </ModalButton>
            <ModalButton
              className="flex-1 max-w-[200px] !bg-brand-primary !hover:bg-brand-secondary text-white h-12 rounded-xl font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              type="submit"
              disabled={saving}
            >
              {saving ? <Loader className="w-5 h-5" /> : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{tCommon("save")}</span>
                </div>
              )}
            </ModalButton>
          </div>
        </form>
      )}
    </Modal>
  );
}
