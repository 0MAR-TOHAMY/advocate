"use client";

import React, { useState } from "react";
import {
    Users, Trash2, Phone, Mail,
    MapPin, User, Briefcase,
    Edit2, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { UniversalTabSection } from "./UniversalTabSection";
import Modal from "@/components/ui/Modal";
import ModalButton from "@/components/ui/ModalButton";
import { Label } from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AdditionalParty {
    name: string;
    capacity?: string;
    phone?: string;
    email?: string;
    address?: string;
    type?: 'client' | 'opposing';
}

interface CaseSecondaryPartiesTabProps {
    caseData: any;
    locale: string;
    t: any;
    tCommon: any;
    onUpdate: () => void;
}

export default function CaseSecondaryPartiesTab({
    caseData,
    locale,
    t,
    tCommon,
    onUpdate
}: CaseSecondaryPartiesTabProps) {
    const isRtl = locale === "ar";
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Prepare data with types for unified display
    const currentClients = (caseData.additionalClients || []) as AdditionalParty[];
    const currentOpponents = (caseData.additionalParties || []) as AdditionalParty[];

    const allParties = [
        ...currentClients.map(c => ({ ...c, type: 'client' as const })),
        ...currentOpponents.map(p => ({ ...p, type: 'opposing' as const }))
    ];

    const totalCount = allParties.length;
    const paginatedParties = allParties.slice((page - 1) * pageSize, page * pageSize);

    // State
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingParty, setEditingParty] = useState<{ party: AdditionalParty, originalIndex: number, originalType: 'client' | 'opposing' } | null>(null);
    const [viewingParty, setViewingParty] = useState<AdditionalParty | null>(null);
    const [partyToDelete, setPartyToDelete] = useState<{ party: AdditionalParty, index: number, type: 'client' | 'opposing' } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [partyType, setPartyType] = useState<"client" | "opposing">("client");

    const resetForm = () => {
        setName("");
        setCapacity("");
        setPhone("");
        setEmail("");
        setAddress("");
        setPartyType("client");
    };

    const openAddModal = () => {
        resetForm();
        setEditingParty(null);
        setIsAdding(true);
    };

    const openEditModal = (party: AdditionalParty, index: number, type: 'client' | 'opposing') => {
        setName(party.name);
        setCapacity(party.capacity || "");
        setPhone(party.phone || "");
        setEmail(party.email || "");
        setAddress(party.address || "");
        setPartyType(type);

        setEditingParty({ party, originalIndex: index, originalType: type });
    };

    const handleSave = async () => {
        if (!name || !partyType) return;
        setIsSaving(true);
        try {
            const newParty: AdditionalParty = {
                name,
                capacity,
                phone,
                email,
                address
            };

            const updatedClients = [...currentClients];
            const updatedOpponents = [...currentOpponents];

            if (editingParty) {
                // If editing, first remove old entry based on ORIGINAL type
                if (editingParty.originalType === 'client') {
                    // Check bounds just in case
                    if (updatedClients[editingParty.originalIndex]) {
                        updatedClients.splice(editingParty.originalIndex, 1);
                    }
                } else {
                    if (updatedOpponents[editingParty.originalIndex]) {
                        updatedOpponents.splice(editingParty.originalIndex, 1);
                    }
                }
            }

            // Add new entry to correct (potentially new) list
            if (partyType === 'client') {
                updatedClients.push(newParty);
            } else {
                updatedOpponents.push(newParty);
            }

            const res = await fetch(`/api/cases/${caseData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    additionalClients: updatedClients,
                    additionalParties: updatedOpponents
                })
            });

            if (res.ok) {
                setIsAdding(false);
                setEditingParty(null);
                resetForm();
                onUpdate();
            }
        } catch (error) {
            console.error("Error saving party:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!partyToDelete) return;
        setIsDeleting(true);
        try {
            const updatedClients = [...currentClients];
            const updatedOpponents = [...currentOpponents];

            if (partyToDelete.type === 'client') {
                updatedClients.splice(partyToDelete.index, 1);
            } else {
                updatedOpponents.splice(partyToDelete.index, 1);
            }

            const res = await fetch(`/api/cases/${caseData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    additionalClients: updatedClients,
                    additionalParties: updatedOpponents
                })
            });

            if (res.ok) {
                setPartyToDelete(null);
                onUpdate();
            }
        } catch (error) {
            console.error("Error deleting party:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <React.Fragment>
            <UniversalTabSection
                title={t("secondaryParties.title")}
                icon={Users}
                count={totalCount}
                countLabel={isRtl ? "أطراف مسجلة" : "Parties Recorded"}
                addButtonLabel={t("secondaryParties.addParty")}
                onAdd={openAddModal}
                data={paginatedParties}
                loading={false}
                isRtl={isRtl}
                colorScheme="indigo"
                emptyTitle={t("secondaryParties.title")}
                emptyDescription={isRtl
                    ? "لم يتم تسجيل أي أطراف إضافية لهذه القضية بعد."
                    : "No additional parties have been recorded for this case yet."}
                tipIcon={Briefcase}
                tipTitle={isRtl ? "إدارة أطراف القضية" : "Case Party Management"}
                tipDescription={isRtl
                    ? "يمكن لفريق العمل الوصول إلى هذه المعلومات لتحسين التنسيق في جلسات الاستماع والتعامل مع جميع الأطراف."
                    : "The work team can access this information to improve coordination during hearings and handling all parties."}
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                onPageChange={setPage}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-none">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{t("secondaryParties.partyType")}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "الطرف" : "Party"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "بيانات التواصل" : "Contact Details"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "العنوان" : "Address"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tCommon("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedParties.map((party, idx) => {
                                // Calculate original index for edit/delete
                                let originalIdx = 0;
                                if (party.type === 'client') {
                                    originalIdx = currentClients.findIndex(c => c.name === party.name && c.phone === party.phone);
                                } else {
                                    originalIdx = currentOpponents.findIndex(o => o.name === party.name && o.phone === party.phone);
                                }

                                // Fallback if not unique, though highly unlikely to fail in normal usage
                                if (originalIdx === -1) originalIdx = idx;

                                return (
                                    <tr key={`${party.type}-${idx}`} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] px-2.5 py-1 border font-black uppercase tracking-wider",
                                                party.type === 'client' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {party.type === 'client' ? t("secondaryParties.types.client") : t("secondaryParties.types.opposing")}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                                                    party.type === 'client' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-rose-50 border-rose-100 text-rose-600"
                                                )}>
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-none mb-1.5">
                                                        {party.name}
                                                    </h4>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                        {party.capacity || (party.type === 'client' ? t("client") : t("opposingParty"))}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {party.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        <span className="text-[11px] font-bold tracking-wider">{party.phone}</span>
                                                    </div>
                                                )}
                                                {party.email && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        <span className="text-[11px] font-bold truncate max-w-[180px]">{party.email}</span>
                                                    </div>
                                                )}
                                                {!party.phone && !party.email && (
                                                    <span className="text-[11px] text-gray-300 italic">---</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-start gap-2 text-gray-500 max-w-[200px]">
                                                <MapPin className="h-3 w-3 text-gray-300 mt-0.5 shrink-0" />
                                                <span className="text-[11px] font-medium leading-relaxed line-clamp-2">
                                                    {party.address || "---"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setViewingParty(party)}
                                                    title={tCommon("view")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(party, originalIdx, party.type || 'client')}
                                                    title={tCommon("edit")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setPartyToDelete({ party, index: originalIdx, type: party.type || 'client' })}
                                                    title={tCommon("delete")}
                                                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </UniversalTabSection>

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isAdding || !!editingParty}
                onClose={() => { setIsAdding(false); setEditingParty(null); }}
                title={editingParty ? t("secondaryParties.editParty") : t("secondaryParties.addParty")}
                className="!max-w-[500px]"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("secondaryParties.partyType")}</Label>
                        <Select
                            value={partyType}
                            onChange={(e: any) => setPartyType(e.target ? e.target.value : e)} // Handle both event or value
                            options={[
                                { label: t("secondaryParties.types.client"), value: "client" },
                                { label: t("secondaryParties.types.opposing"), value: "opposing" }
                            ]}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("name")}</Label>
                        <Input
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                            placeholder={t("secondaryParties.partyNamePlaceholder")}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("secondaryParties.capacity")}</Label>
                        <Input
                            value={capacity}
                            onChange={(e: any) => setCapacity(e.target.value)}
                            placeholder={t("secondaryParties.capacityPlaceholder")}
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("phone")}</Label>
                            <Input
                                value={phone}
                                onChange={(e: any) => setPhone(e.target.value)}
                                placeholder="+966..."
                                className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("email")}</Label>
                            <Input
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                                className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mx-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("address")}</Label>
                        <Textarea
                            value={address}
                            onChange={(e: any) => setAddress(e.target.value)}
                            placeholder={t("secondaryParties.addressPlaceholder")}
                            className="w-full rounded-[15px] bg-gray-50/50 min-h-[100px] px-[20px] py-3 text-[14px] placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-gray-700 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => { setIsAdding(false); setEditingParty(null); }}
                            disabled={isSaving}
                            className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleSave}
                            loading={isSaving}
                            className="flex-1 !bg-indigo-600 text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border-none"
                        >
                            {tCommon("save")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingParty}
                onClose={() => setViewingParty(null)}
                title={t("secondaryParties.viewParty")}
                className="!max-w-[450px]"
            >
                {viewingParty && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div className={cn(
                                "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                                viewingParty.type === 'client' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-rose-50 border-rose-100 text-rose-600"
                            )}>
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{viewingParty.name}</h3>
                                <Badge variant="outline" className={cn(
                                    "text-[9px] px-2 py-0.5 border font-black uppercase tracking-wider mt-1",
                                    viewingParty.type === 'client' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {viewingParty.type === 'client' ? t("secondaryParties.types.client") : t("secondaryParties.types.opposing")}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("secondaryParties.capacity")}</p>
                                    <p className="text-[13px] font-bold text-gray-900">{viewingParty.capacity || "---"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("phone")}</p>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <p className="text-[13px] font-bold text-gray-900 ltr:font-mono">{viewingParty.phone || "---"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("email")}</p>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <p className="text-[13px] font-bold text-gray-900">{viewingParty.email || "---"}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("address")}</p>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <p className="text-[13px] font-bold text-gray-900 leading-relaxed">{viewingParty.address || "---"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setViewingParty(null)}
                                className="px-10 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                            >
                                {tCommon("close")}
                            </ModalButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!partyToDelete}
                onClose={() => setPartyToDelete(null)}
                title={t("secondaryParties.deleteParty")}
                className="!max-w-[400px]"
            >
                <div className="space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-[32px] bg-rose-50 flex items-center justify-center mx-auto border-none">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {isRtl ? "هل أنت متأكد؟" : "Are you sure?"}
                            </h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {isRtl ? "سيتم حذف الطرف ولا يمكن التراجع" : "Party delete is permanent"}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                        {t("secondaryParties.areYouSureDelete")}
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setPartyToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleDelete}
                            loading={isDeleting}
                            className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border-none"
                        >
                            {tCommon("delete")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
}
