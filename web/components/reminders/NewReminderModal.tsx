/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Users, ClipboardList, Flag, Clock, Tag, X, Briefcase } from "lucide-react";
import AlertModal from "@/components/ui/AlertModal";
import ModalButton from "@/components/ui/ModalButton";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Permissions } from "@/lib/auth/permissions";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function NewReminderModal({ open, onClose, onCreated }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const t = useTranslations("reminders");
  const commonT = useTranslations("common");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [scope, setScope] = useState<"personal" | "firm">("personal");
  const [reminderType, setReminderType] = useState("custom");
  const [caseId, setCaseId] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);

  const [cases, setCases] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const REMINDER_TYPES = [
    { value: "custom", label: t("types.custom") },
    { value: "deadline", label: t("types.deadline") },
    { value: "hearing", label: t("types.hearing") },
    { value: "document_expiry", label: t("types.document_expiry") },
    { value: "judgment_appeal", label: t("types.judgment_appeal") },
  ];

  // Strict: Admins also need explicit permission if we want to be purely role-based, 
  // but usually admin has all. However, user asked for strict privacy.
  // For UI convenience, we assume if they have the permission key or are admin (often implies all), they can see the button.
  // BUT the API will enforce strictness. 
  // Let's stick to the key check for clarity to the user based on their role.
  const canManageFirm = user?.permissions?.includes(Permissions.REMINDERS_MANAGE_FIRM) || isAdmin;
  const canManageOwn = user?.permissions?.includes(Permissions.REMINDERS_MANAGE_OWN) || isAdmin;

  // If user has NO permissions, they might not be able to create anything.
  // We should default scope based on what they CAN do.

  useEffect(() => {
    if (open) {
      // Set initial scope
      if (canManageOwn) {
        setScope("personal");
      } else if (canManageFirm) {
        setScope("firm");
      }
      // If neither, they might see a locked UI or error (handled by disabled buttons below)
      // Fetch Cases
      fetch("/api/cases?pageSize=100")
        .then((res) => res.json())
        .then((data) => setCases(data.items || []))
        .catch(() => setCases([]));

      // Fetch Members if user has firm access
      if (user?.firmId) {
        fetch(`/api/firms/${user.firmId}/members`)
          .then((res) => res.json())
          .then((data) => setMembers(data.members || []))
          .catch(() => setMembers([]));
      }
    }
  }, [open, user?.firmId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !dueDate) {
      setAlertMessage(t("errorTitleReq") + ", " + t("errorMessageReq") + ", " + t("errorDateReq"));
      setAlertOpen(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          dueDate: new Date(dueDate).toISOString(),
          priority,
          scope,
          assignedTo: scope === "firm" ? (assignedTo.length > 0 ? assignedTo : "all") : null,
          relatedEntityId: caseId || null,
          relatedEntityType: caseId ? "case" : null,
          reminderType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create reminder");
      }

      // Reset & Close
      setTitle("");
      setMessage("");
      setDueDate("");
      setPriority("medium");
      setCaseId("");
      setScope("personal");
      setReminderType("custom");
      setAssignedTo([]);
      onClose();
      onCreated && onCreated();
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

  return (
    <Modal isOpen={open} onClose={onClose} title={t("addReminder")} className="p-0">
      <form className="space-y-3 w-full" onSubmit={handleSubmit}>

        {/* ROW 1: Title */}
        <div className="w-full">
          <Input
            value={title}
            onChange={(e) => setTitle((e.target as any).value)}
            placeholder={t("title") + " *"}
            required
            className="h-12 !text-[14px] font-bold w-full"
          />
        </div>

        {/* ROW 2: Type & Related Case */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            value={reminderType}
            onChange={(v) => setReminderType(v)}
            placeholder={t("types.custom")}
            options={REMINDER_TYPES}
            className="h-12 !text-[12px] font-bold text-gray-700"
          />
          <Select
            value={caseId}
            onChange={(v) => setCaseId(v)}
            placeholder={t("noRelatedCase")}
            options={[
              { value: "", label: t("noRelatedCase") },
              ...cases.map((c) => ({ value: c.id, label: `${c.caseNumber} - ${c.title}` })),
            ]}
            className="h-12 !text-[12px] font-bold text-gray-700"
          />
        </div>

        {/* ROW 2: Message / Description */}
        <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
          <Textarea
            value={message}
            onChange={(e) => setMessage((e.target as any).value)}
            placeholder={t("subtitle") + " *"}
            required
            rows={3}
            className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
          />
        </div>

        {/* ROW 3: Scope Selection (Personal / Firm) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            title={!canManageOwn ? t("noPermission") : ""}
            onClick={() => setScope("personal")}
            className={`flex items-center justify-center gap-2 rounded-xl border transition-all text-sm font-bold h-12 ${scope === "personal"
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
            onClick={() => setScope("firm")}
            className={`flex items-center justify-center gap-2 rounded-xl border transition-all text-sm font-bold h-12 ${scope === "firm"
              ? "bg-purple-50 border-purple-200 text-purple-700"
              : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
          >
            <Users size={16} />
            <span>{t("firm")}</span>
          </button>
        </div>

        {/* Conditional: Assignees - if scope is firm */}
        {scope === "firm" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-400">
            {assignedTo.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {members.filter(m => assignedTo.includes(m.id)).map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/20 text-brand-primary rounded-xl text-[11px] font-bold hover:border-brand-primary/30 transition-colors"
                  >
                    {member.name}
                    <button
                      type="button"
                      onClick={() => setAssignedTo(prev => prev.filter(id => id !== member.id))}
                      className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Select
              value=""
              placeholder={t("selectAssignee")}
              onChange={(val) => {
                if (val && !assignedTo.includes(val)) {
                  setAssignedTo(prev => [...prev, val]);
                }
              }}
              options={[
                ...members
                  .filter(m => !assignedTo.includes(m.id))
                  .map(m => ({ value: m.id, label: m.name }))
              ]}
              className="w-full h-12"
            />
            {assignedTo.length === 0 && (
              <p className="text-[11px] text-gray-400 px-3 italic font-medium">
                {locale === "ar" ? "* سيتم توجيه التذكير لكافة أعضاء المكتب بشكل افتراضي" : "* Reminder will be sent to all firm members by default"}
              </p>
            )}
          </div>
        )}

        {/* ROW 5: Priority Selection */}
        <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
          <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
            {t("priority")}
          </label>
          <div className="flex flex-wrap gap-2 pt-8 px-2 pb-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${priority === p.value
                  ? `${p.color} border-current scale-[1.02]`
                  : "bg-white border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 4: Due Date */}
        <div className="">
          <DateTimeInput
            placeholder={t("dueDate")}
            value={dueDate}
            onChange={(v) => setDueDate(v)}
            locale={locale}
            // Override internal styles from parent as requested:
            // [&>div>div]: targets the inner container to reduce height from 75px to match other inputs (approx 50-60px)
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
            {commonT("cancel")}
          </ModalButton>
          <ModalButton
            className="flex-1 max-w-[200px] !bg-brand-primary !hover:bg-brand-secondary text-white h-12 rounded-xl font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            type="submit"
            disabled={saving}
          >
            {saving ? <Loader className="w-5 h-5" /> : (
              <>
                <span>{commonT("save")}</span>
              </>
            )}
          </ModalButton>
        </div>
      </form>
      <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
    </Modal>
  );
}
