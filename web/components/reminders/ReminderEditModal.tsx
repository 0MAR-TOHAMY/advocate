/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import DateTimeInput from "@/components/ui/DateTimeInput";
import AlertModal from "@/components/ui/AlertModal";
import ModalButton from "@/components/ui/ModalButton";
import { FileText, Clock, Tag, CheckCircle, AlertTriangle, User, Users, ClipboardList, Flag, X, MapPin, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Permissions } from "@/lib/auth/permissions";

type Reminder = {
  id: string;
  title: string;
  message?: string | null;
  dueDate: string | Date;
  priority: string;
  status: string;
  scope: "personal" | "firm";
  assignedTo?: string[] | string | null;
  snoozedUntil?: string | Date | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  reminderType: string;
  createdBy: string;
};

export default function ReminderEditModal({ open, onClose, id, onSaved, readOnly: forceReadOnly }: { open: boolean; onClose: () => void; id: string | null; onSaved?: () => void; readOnly?: boolean }) {
  const t = useTranslations("reminders");
  const commonT = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRTL = locale === "ar";
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<Reminder | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Permission logic
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isCreator = state?.createdBy === user?.id;
  const assignees = state?.assignedTo ? (typeof state.assignedTo === 'string' ? JSON.parse(state.assignedTo) : state.assignedTo) : [];
  const isAssignee = Array.isArray(assignees) ? assignees.includes(user?.id) : assignees === "all";

  const canEditFull = isAdmin || isCreator;
  const canUpdateStatus = isAdmin || isCreator || isAssignee;
  const isReadOnly = forceReadOnly || !canUpdateStatus;

  const canManageFirm = isAdmin || user?.permissions?.includes(Permissions.REMINDERS_MANAGE_FIRM);
  const canManageOwn = isAdmin || user?.permissions?.includes(Permissions.REMINDERS_MANAGE_OWN);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/reminders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setState(data.reminder);
        }
      } finally {
        setLoading(false);
      }
    }
    if (open && id) load();
  }, [open, id]);

  useEffect(() => {
    async function loadResources() {
      if (!open) return;
      try {
        const [casesRes, membersRes] = await Promise.all([
          fetch("/api/cases?pageSize=100"),
          user?.firmId ? fetch(`/api/firms/${user.firmId}/members`) : null
        ]);

        if (casesRes?.ok) {
          const data = await casesRes.json();
          setCases(data.items || []);
        }
        if (membersRes?.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }
      } catch (e) {
        console.error("Failed to load resources", e);
      }
    }
    loadResources();
  }, [open, user?.firmId]);

  const fmt = (dt?: string | Date | null) => {
    if (!dt) return "";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;

    setSaving(true);
    try {
      const payload: any = canEditFull ? {
        title: state.title,
        message: state.message,
        dueDate: new Date(state.dueDate).toISOString(),
        priority: state.priority,
        status: state.status,
        scope: state.scope,
        assignedTo: state.scope === "firm" ? (Array.isArray(state.assignedTo) ? state.assignedTo : []) : null,
        relatedEntityId: state.relatedEntityId,
        relatedEntityType: state.relatedEntityId ? "case" : null,
        reminderType: state.reminderType,
        snoozedUntil: state.snoozedUntil ? new Date(state.snoozedUntil).toISOString() : null,
      } : {
        status: state.status,
        snoozedUntil: state.snoozedUntil ? new Date(state.snoozedUntil).toISOString() : null,
      };

      const res = await fetch(`/api/reminders/${state.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      onSaved && onSaved();
      onClose();
    } catch (error: any) {
      setAlertMessage(error.message);
      setAlertOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const PRIORITIES = [
    { value: "low", label: t("priorities.low"), color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { value: "medium", label: t("priorities.medium"), color: "bg-blue-50 text-blue-700 !border-blue-100" },
    { value: "high", label: t("priorities.high"), color: "bg-orange-50 text-orange-700 border-orange-100" },
    { value: "urgent", label: t("priorities.urgent"), color: "bg-red-50 text-red-700 border-red-100" },
  ];

  const STATUSES = [
    { value: "active", label: t("statuses.active"), color: "bg-blue-50 text-blue-700 !border-blue-100" },
    { value: "completed", label: t("statuses.completed"), color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { value: "snoozed", label: t("statuses.snoozed"), color: "bg-amber-50 text-amber-700 border-amber-100" },
    { value: "dismissed", label: t("statuses.dismissed"), color: "bg-gray-50 text-gray-700 border-gray-100" },
  ];

  const REMINDER_TYPES = [
    { value: "custom", label: t("types.custom"), color: "bg-gray-50 text-gray-600 border-gray-200" }, // Default
    { value: "deadline", label: t("types.deadline"), color: "bg-red-50 text-red-700 border-red-100" },
    { value: "hearing", label: t("types.hearing"), color: "bg-purple-50 text-purple-700 border-purple-100" },
    { value: "document_expiry", label: t("types.document_expiry"), color: "bg-amber-50 text-amber-700 border-amber-100" },
    { value: "judgment_appeal", label: t("types.judgment_appeal"), color: "bg-orange-50 text-orange-700 border-orange-100" },
  ];

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title={canEditFull ? t("editReminder") : t("title")} className="p-0">
      {loading || !state ? (
        <div className="py-20 flex justify-center"><Loader /></div>
      ) : (
        <div className="space-y-6 py-2">
          {!canEditFull || isReadOnly ? (
            // RICH VIEW MODE (Read Only / Status Update)
            <div className="space-y-6">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {state.scope === "personal" ? (
                    <Badge variant="brand-outline" className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1 font-black text-[10px] uppercase">
                      <User size={12} /> {t("personal")}
                    </Badge>
                  ) : (
                    <Badge variant="brand-outline" className="bg-purple-50 text-purple-700 border-purple-100 flex items-center gap-1 font-black text-[10px] uppercase">
                      <Users size={12} /> {t("firm")}
                    </Badge>
                  )}
                  <Badge variant={state.priority === "urgent" ? "destructive" : "secondary"} className={cn(
                    "capitalize font-black text-[10px] uppercase tracking-wider border",
                    PRIORITIES.find(p => p.value === state.priority)?.color
                  )}>
                    {t(`priorities.${state.priority}`)}
                  </Badge>
                  {state.reminderType && (
                    <Badge variant="outline" className={cn(
                      "capitalize font-black text-[10px] uppercase tracking-wider border",
                      REMINDER_TYPES.find(t => t.value === state.reminderType)?.color || "bg-gray-50 text-gray-500"
                    )}>
                      {REMINDER_TYPES.find(t => t.value === state.reminderType)?.label || state.reminderType}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {state.title}
                </h2>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Time */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("dueDate")}</p>
                    <p className="text-sm font-bold text-gray-700">
                      {new Date(state.dueDate).toLocaleString(locale, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {state.status === "snoozed" && state.snoozedUntil && (
                      <>
                        <div className="w-full h-px bg-gray-200 my-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("snoozedUntil")}</p>
                        <p className="text-sm font-bold text-amber-600">
                          {new Date(state.snoozedUntil).toLocaleString(locale, {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {state.message && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-amber-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("subtitle")}</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{state.message}</p>
                    </div>
                  </div>
                )}

                {/* Linked Case */}
                {state.relatedEntityId && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("relatedCase")}</p>
                      <p className="text-sm font-bold text-gray-700">
                        {cases.find(c => c.id === state.relatedEntityId)?.title || t("noRelatedCase")}
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {cases.find(c => c.id === state.relatedEntityId)?.caseNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Update Form (for assignees) */}
                {/* Status Update Form (for assignees) */}
                {!isReadOnly ? (
                  <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                      <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                        {t("status")}
                      </label>
                      <div className="flex flex-wrap gap-2 pt-8 px-2 pb-2">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setState({ ...state, status: s.value })}
                            className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${state.status === s.value
                              ? `${s.color} border-current shadow-sm scale-[1.02]`
                              : "bg-white border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {state.status === "snoozed" && (
                      <div className="animate-in fade-in zoom-in duration-300 relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                        <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                          {t("snoozedUntil")}
                        </label>
                        <div className="pt-6">
                          <DateTimeInput
                            value={fmt(state.snoozedUntil)}
                            onChange={(v) => setState({ ...state, snoozedUntil: v })}
                            locale={locale}
                            className="!bg-transparent !border-none !shadow-none !h-12 text-sm font-bold text-gray-700"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <ModalButton
                        className="!bg-brand-primary !hover:bg-brand-secondary text-white px-12 h-12 rounded-xl font-bold shadow-md active:scale-95"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? <Loader className="w-5 h-5 mx-auto" /> : commonT("save")}
                      </ModalButton>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <ModalButton
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="font-black text-gray-500 hover:text-gray-700 px-8 rounded-xl"
                    >
                      {commonT("close")}
                    </ModalButton>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // RICH EDIT MODE (Admin / Creator)
            <form className="space-y-3 w-full" onSubmit={handleSave}>

              {/* ROW 1: Title & Related Case */}
              {/* ROW 1: Title */}
              <div className="w-full">
                <Input
                  value={state.title}
                  onChange={(e) => setState({ ...state, title: (e.target as any).value })}
                  placeholder={t("title") + " *"}
                  required
                  className="h-12 !text-[14px] font-bold w-full"
                />
              </div>

              {/* ROW 2: Type & Related Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  value={state.reminderType || "custom"}
                  onChange={(v) => setState({ ...state, reminderType: v })}
                  placeholder={t("types.custom")}
                  options={REMINDER_TYPES.map(rt => ({ value: rt.value, label: rt.label }))}
                  className="h-12 !text-[14px] text-gray-700"
                />
                <Select
                  value={state.relatedEntityId || ""}
                  onChange={(v) => setState({ ...state, relatedEntityId: v, relatedEntityType: v ? "case" : null })}
                  placeholder={t("noRelatedCase")}
                  options={[
                    { value: "", label: t("noRelatedCase") },
                    ...cases.map((c) => ({ value: c.id, label: `${c.caseNumber} - ${c.title}` })),
                  ]}
                  className="h-12 !text-[14px] text-gray-700"
                />
              </div>

              {/* ROW 2: Message / Description */}
              <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                <Textarea
                  value={state.message || ""}
                  onChange={(e) => setState({ ...state, message: (e.target as any).value })}
                  placeholder={t("subtitle")}
                  rows={3}
                  className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
                />
              </div>

              {/* ROW 3: Scope Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!canManageOwn}
                  onClick={() => setState({ ...state, scope: "personal" })}
                  className={`flex items-center justify-center gap-2 rounded-xl border transition-all text-sm font-bold h-12 ${state.scope === "personal"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  <User size={16} />
                  <span>{t("personal")}</span>
                </button>
                <button
                  type="button"
                  disabled={!canManageFirm}
                  onClick={() => setState({ ...state, scope: "firm" })}
                  className={`flex items-center justify-center gap-2 rounded-xl border transition-all text-sm font-bold h-12 ${state.scope === "firm"
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  <Users size={16} />
                  <span>{t("firm")}</span>
                </button>
              </div>

              {/* ROW 4: Due Date */}
              <div className="space-y-1.5">
                <DateTimeInput
                  placeholder={t("dueDate")}
                  value={fmt(state.dueDate)}
                  onChange={(v) => setState({ ...state, dueDate: v })}
                  locale={locale}
                  className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[55px] [&>div>div]:!py-2 [&>div>div]:!border-none [&>div>div]:!shadow-none"
                />
              </div>

              {/* ROW 5: Priority & Status Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                  <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                    {t("priority")}
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-8 px-2 pb-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setState({ ...state, priority: p.value })}
                        className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${state.priority === p.value
                          ? `${p.color} border-current scale-[1.02]`
                          : "bg-white border-transparent text-gray-400 hover:bg-gray-50"
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                  <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                    {t("status")}
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-8 px-2 pb-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setState({ ...state, status: s.value })}
                        className={`flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${state.status === s.value
                          ? `${s.color} border-current scale-[1.02]`
                          : "bg-white border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {state.status === "snoozed" && (
                <div className="animate-in fade-in zoom-in duration-300 relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                  <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                    {t("snoozedUntil")}
                  </label>
                  <div className="pt-6">
                    <DateTimeInput
                      value={fmt(state.snoozedUntil)}
                      onChange={(v) => setState({ ...state, snoozedUntil: v })}
                      locale={locale}
                      className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[55px] [&>div>div]:!py-2 [&>div>div]:!bg-transparent [&>div>div]:!border-none [&>div>div]:!shadow-none"
                    />
                  </div>
                </div>
              )}

              {/* Conditional: Assignees - if scope is firm */}
              {state.scope === "firm" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-400">
                  {/* Badges Container */}
                  {assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {assignees.includes("all") ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-[11px] font-black">
                          {t("allMembers")}
                          <button
                            type="button"
                            onClick={() => setState({ ...state, assignedTo: [] })}
                            className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        members.filter(m => assignees.includes(m.id)).map(member => (
                          <div
                            key={member.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/20 text-brand-primary rounded-xl text-[11px] font-bold hover:border-brand-primary/30 transition-colors"
                          >
                            {member.name}
                            <button
                              type="button"
                              onClick={() => {
                                const current = Array.isArray(state.assignedTo) ? state.assignedTo : (state.assignedTo ? JSON.parse(state.assignedTo as string) : []);
                                setState({ ...state, assignedTo: current.filter((id: string) => id !== member.id) });
                              }}
                              className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {!assignees.includes("all") && (
                    <Select
                      value=""
                      placeholder={t("selectAssignee")}
                      onChange={(val) => {
                        if (val === "all") {
                          setState({ ...state, assignedTo: ["all"] });
                        } else if (val && !assignees.includes(val)) {
                          setState({ ...state, assignedTo: [...assignees, val] });
                        }
                      }}
                      options={[
                        { value: "all", label: locale === 'ar' ? "كافة الأعضاء" : "All Members" },
                        ...members
                          .filter(m => !assignees.includes(m.id))
                          .map(m => ({ value: m.id, label: m.name }))
                      ]}
                      className="w-full h-12"
                    />
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <ModalButton
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="px-8 h-12 rounded-xl font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                >
                  {commonT("cancel")}
                </ModalButton>
                <ModalButton
                  className="flex-1 max-w-[200px] !bg-brand-primary !hover:bg-brand-secondary text-white h-12 rounded-xl font-black transition-all shadow-md active:scale-95"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? <Loader className="w-5 h-5 mx-auto" /> : commonT("save")}
                </ModalButton>
              </div>
            </form>
          )}
        </div>
      )}
      <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
    </Modal>
  );
}
