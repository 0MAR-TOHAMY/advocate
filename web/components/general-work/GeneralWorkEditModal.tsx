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
    User, Briefcase, Activity, Calendar, DollarSign,
    AlertCircle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

type WorkItem = {
    id: string;
    title: string;
    description: string | null;
    workType: string;
    status: string;
    priority: string;
    fee: number | null;
    paid: number | null;
    paymentStatus: string;
    startDate: string | null;
    dueDate: string | null;
    completionDate: string | null;
    assignedTo: string | null;
    clientId: string;
};

export default function GeneralWorkEditModal({ open, onClose, workId, initial, onSaved }: { open: boolean; onClose: () => void; workId: string | null; initial?: WorkItem | null; onSaved?: () => void }) {
    const params = useParams();
    const locale = (params?.locale as string) || "ar";
    const isRtl = locale === "ar";
    const tCommon = useTranslations("common");
    const t = useTranslations("generalWork");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState<WorkItem | null>(initial || null);
    const [members, setMembers] = useState<{ value: string; label: string }[]>([]);
    const [clients, setClients] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        async function load() {
            if (!workId) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/general-work/${workId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Convert fee and paid from fils/cents to whole currency if stored multiplied by 1000
                    // Currently in Wizard we multiply by 1000 before sending.
                    // API returns what's in DB.
                    // Let's assume DB has values multiplied by 1000.
                    if (data.fee) data.fee = data.fee / 1000;
                    if (data.paid) data.paid = data.paid / 1000;
                    setState(data);
                }
            } finally { setLoading(false); }
        }
        if (open && workId && !initial) load();

        // Fetch members and clients
        if (open) {
            // Get firmId first
            fetch("/api/auth/me")
                .then((res) => res.json())
                .then((authData) => {
                    const firmId = authData.user?.firmId;
                    if (firmId) {
                        // Fetch Members
                        fetch(`/api/firms/${firmId}/members`)
                            .then(res => res.json())
                            .then(data => {
                                setMembers((data.members || []).map((m: any) => ({ value: m.id, label: m.name })));
                            });

                        // Fetch Clients
                        fetch(`/api/clients?loading=false`) // assuming clients api exists and returns list
                            .then(res => res.json())
                            .then(data => {
                                setClients((data.clients || []).map((c: any) => ({ value: c.id, label: c.name })));
                            });
                    }
                });
        }
    }, [open, workId, initial]);

    function fmt(dt?: string | Date | null) {
        if (!dt) return "";
        const d = typeof dt === "string" ? new Date(dt) : dt;
        return d.toISOString();
    }

    // Helper to ensure numeric inputs are treated safely
    const handleNumber = (val: string) => {
        if (val === "") return null;
        return parseFloat(val);
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={t("editWork")}>
            {loading || !state ? (
                <div className="py-20 flex justify-center"><Loader /></div>
            ) : (
                <form
                    className="space-y-4 w-full"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setSaving(true);
                        try {
                            const payload = {
                                ...state,
                                // When sending back, re-multiply by 1000 for precision if that's the convention
                                // Based on AddWorkWizard: body.fee * 1000
                                fee: state.fee ? Number(state.fee) : null,
                                paid: state.paid ? Number(state.paid) : 0,
                                startDate: state.startDate ? new Date(state.startDate).toISOString() : null,
                                dueDate: state.dueDate ? new Date(state.dueDate).toISOString() : null,
                                completionDate: state.completionDate ? new Date(state.completionDate).toISOString() : null,
                            };

                            // API expects fee and paid in plain format then it multiplies by 1000? 
                            // Let's check PATCH route. 
                            // PATCH route: if (body.fee !== undefined) updateData.fee = body.fee ? Math.round(body.fee * 1000) : null;
                            // So yes, I should send plain numbers, route handles multiplication.

                            const res = await fetch(`/api/general-work/${state.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                            });
                            if (res.ok) {
                                onClose();
                                onSaved && onSaved();
                            }
                        } finally { setSaving(false); }
                    }}
                >
                    {/* Work Info Section */}
                    <div className="space-y-3">
                        <div className="w-full">
                            <Input
                                value={state.title || ""}
                                onChange={(e) => setState({ ...state, title: e.target.value })}
                                required
                                placeholder={t("workTitle") + " *"}
                                className="h-12 !text-[14px] font-bold w-full"
                            />
                        </div>

                        <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                            <Textarea
                                value={state.description || ""}
                                onChange={(e) => setState({ ...state, description: e.target.value })}
                                rows={3}
                                placeholder={t("description")}
                                className="!bg-transparent !border-none !shadow-none p-4 text-sm font-medium leading-relaxed resize-none focus:!ring-0 focus:!outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select
                                options={[
                                    { value: "consultation", label: t("workTypes.consultation") },
                                    { value: "legal_notice", label: t("workTypes.legal_notice") }, // Note: keys might differ, need to verify ar.json keys
                                    { value: "contract_drafting", label: t("workTypes.contract_drafting") },
                                    { value: "contract_review", label: t("workTypes.contract_review") },
                                    { value: "legal_opinion", label: t("workTypes.legal_opinion") },
                                    { value: "other", label: t("workTypes.other") },
                                ]}
                                value={state.workType || "consultation"}
                                onChange={(v) => setState({ ...state, workType: v })}
                                placeholder={t("workType")}
                                className="h-12 !text-[12px] font-bold text-gray-700"
                            />

                            <Select
                                options={clients}
                                value={state.clientId || ""}
                                onChange={(v) => setState({ ...state, clientId: v })}
                                placeholder={t("client")}
                                className="h-12 !text-[12px] font-bold text-gray-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select
                                options={[
                                    { value: "pending", label: t("statuses.pending") },
                                    { value: "in_progress", label: t("statuses.in_progress") },
                                    { value: "completed", label: t("statuses.completed") },
                                    { value: "cancelled", label: t("statuses.cancelled") },
                                ]}
                                value={state.status || "pending"}
                                onChange={(v) => setState({ ...state, status: v })}
                                placeholder={t("status")}
                                className="h-12 !text-[12px] font-bold text-gray-700"
                            />
                            <Select
                                options={[
                                    { value: "low", label: t("priorities.low") },
                                    { value: "medium", label: t("priorities.medium") },
                                    { value: "high", label: t("priorities.high") },
                                    { value: "urgent", label: t("priorities.urgent") },
                                ]}
                                value={state.priority || "medium"}
                                onChange={(v) => setState({ ...state, priority: v })}
                                placeholder={t("priority")}
                                className="h-12 !text-[12px] font-bold text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-4" />

                    {/* Financials & Assignment */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative group">
                                <DollarSign className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
                                <Input
                                    type="number"
                                    value={state.fee?.toString() || ""}
                                    onChange={(e) => setState({ ...state, fee: handleNumber(e.target.value) })}
                                    placeholder={t("fee")}
                                    className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
                                />
                            </div>
                            <div className="relative group">
                                <DollarSign className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
                                <Input
                                    type="number"
                                    value={state.paid?.toString() || ""}
                                    onChange={(e) => setState({ ...state, paid: handleNumber(e.target.value) })}
                                    placeholder={t("paidAmount")}
                                    className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select
                                options={[
                                    { value: "unpaid", label: t("paymentStatuses.unpaid") },
                                    { value: "partial", label: t("paymentStatuses.partial") },
                                    { value: "paid", label: t("paymentStatuses.paid") },
                                ]}
                                value={state.paymentStatus || "unpaid"}
                                onChange={(v) => setState({ ...state, paymentStatus: v })}
                                placeholder={t("paymentStatus")}
                                className="h-12 !text-[12px] font-bold text-gray-700"
                            />

                            <div className="relative group">
                                <User className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400", isRtl ? "right-4" : "left-4")} />
                                <Select
                                    options={members}
                                    value={state.assignedTo || ""}
                                    onChange={(v) => setState({ ...state, assignedTo: v })}
                                    placeholder={t("assigned")}
                                    className={cn("h-12 !text-[12px] font-bold text-gray-700", isRtl ? "pr-10" : "pl-10")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-4" />

                    {/* Dates */}
                    <div className="grid grid-cols-1 gap-3">
                        <DateTimeInput
                            value={fmt(state.startDate)}
                            onChange={(v) => setState({ ...state, startDate: v })}
                            placeholder={t("startDate")}
                            className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[50px] [&>div>div]:!py-2 [&>div>div]:!border-none [&>div>div]:!shadow-none bg-gray-50 rounded-xl"
                        />
                        <DateTimeInput
                            value={fmt(state.dueDate)}
                            onChange={(v) => setState({ ...state, dueDate: v })}
                            placeholder={t("dueDate")}
                            className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[50px] [&>div>div]:!py-2 [&>div>div]:!border-none [&>div>div]:!shadow-none bg-gray-50 rounded-xl"
                        />
                        <DateTimeInput
                            value={fmt(state.completionDate)}
                            onChange={(v) => setState({ ...state, completionDate: v })}
                            placeholder={t("completionDate")}
                            className="text-sm font-bold text-gray-700 [&>div>div]:!min-h-[50px] [&>div>div]:!py-2 [&>div>div]:!border-none [&>div>div]:!shadow-none bg-gray-50 rounded-xl"
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
