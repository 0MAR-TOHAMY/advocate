"use client";

import { useState } from "react";
import { Lock, Unlock, ShieldAlert, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Permissions } from "@/lib/auth/permissions";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Disclosure, Transition } from "@headlessui/react";
import { useAlert } from "@/hooks/useAlert";
import AlertContainer from "@/components/ui/AlertContainer";

import { GranularPermissionEditor, PolicyRule } from "./GranularPermissionEditor";

interface RoleEditorProps {
    firmId: string | null;
    initialRole?: {
        id?: string;
        name: string;
        description?: string | null;
        permissions: string[];
        policy?: { resources: PolicyRule[] } | null;
    } | null;
    onSave: () => void;
    onCancel?: () => void;
}

export function RoleEditor({ firmId, initialRole, onSave, onCancel }: RoleEditorProps) {
    const t = useTranslations("firm.roles");
    const [name, setName] = useState(initialRole?.name || "");
    const [description, setDescription] = useState(initialRole?.description || "");
    const [selectedPerms, setSelectedPerms] = useState<string[]>(initialRole?.permissions || []);
    const [policyResources, setPolicyResources] = useState<PolicyRule[]>(initialRole?.policy?.resources || []);
    const [isSaving, setIsSaving] = useState(false);
    const { alerts, showAlert, closeAlert } = useAlert();

    const handleSave = async () => {
        if (!firmId) return;
        setIsSaving(true);
        try {
            const url = initialRole?.id
                ? `/api/firms/${firmId}/roles/${initialRole.id}`
                : `/api/firms/${firmId}/roles`;

            const method = initialRole?.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    name,
                    description,
                    permissions: selectedPerms,
                    policy: { resources: policyResources }
                }),
            });
            if (res.ok) {
                showAlert("success", t("success") || "Role saved successfully");
                setTimeout(() => {
                    onSave();
                    if (!initialRole) {
                        setName("");
                        setDescription("");
                        setSelectedPerms([]);
                        setPolicyResources([]);
                    }
                }, 1000);
            } else {
                showAlert("error", t("error") || "Error saving role");
            }
        } catch (e) {
            console.error(e);
            showAlert("error", t("error") || "Error saving role");
        } finally {
            setIsSaving(false);
        }
    };

    const PERMISSION_GROUPS = [
        {
            title: t("groups.case"),
            permissions: [
                { key: Permissions.CASES_VIEW, label: t("permissions.viewCases") },
                { key: Permissions.CASES_CREATE, label: t("permissions.createCases") },
                { key: Permissions.CASES_EDIT, label: t("permissions.editCases") },
                { key: Permissions.CASES_DELETE, label: t("permissions.deleteCases"), risk: "high" },
                { key: Permissions.CASES_VIEW_SENSITIVE, label: t("permissions.viewFinancials"), risk: "medium" },
            ],
        },
        {
            title: t("groups.client"),
            permissions: [
                { key: Permissions.CLIENTS_VIEW, label: t("permissions.viewClients") },
                { key: Permissions.CLIENTS_CREATE, label: t("permissions.createClients") },
                { key: Permissions.CLIENTS_EDIT, label: t("permissions.editClients") },
                { key: Permissions.CLIENTS_DELETE, label: t("permissions.deleteClients"), risk: "high" },
            ],
        },
        {
            title: t("groups.generalWork") || "General Work",
            permissions: [
                { key: Permissions.GENERAL_WORK_VIEW, label: t("permissions.viewGeneralWork") || "View General Work" },
                { key: Permissions.GENERAL_WORK_CREATE, label: t("permissions.createGeneralWork") || "Create General Work" },
                { key: Permissions.GENERAL_WORK_EDIT, label: t("permissions.editGeneralWork") || "Edit General Work" },
                { key: Permissions.GENERAL_WORK_DELETE, label: t("permissions.deleteGeneralWork") || "Delete General Work", risk: "high" },
            ],
        },
        {
            title: t("groups.documents") || "Documents",
            permissions: [
                { key: Permissions.DOCUMENTS_VIEW_ALL, label: t("permissions.viewAllDocuments") || "View All Documents (Admin)", risk: "medium" },
                { key: Permissions.DOCUMENTS_UPLOAD, label: t("permissions.uploadDocuments") || "Upload Documents" },
                { key: Permissions.DOCUMENTS_DELETE, label: t("permissions.deleteDocuments") || "Delete Documents", risk: "high" },
            ],
        },
        {
            title: t("groups.financials") || "Financials & Billing",
            permissions: [
                { key: Permissions.FINANCIALS_VIEW, label: t("permissions.viewFinancials") || "View Financials" },
                { key: Permissions.FINANCIALS_MANAGE, label: t("permissions.manageFinancials") || "Manage Payments & Refunds", risk: "high" },
                { key: Permissions.INVOICES_CREATE, label: t("permissions.createInvoices") || "Create Invoices" },
            ],
        },
        {
            title: t("groups.calendar") || "Calendar & Events",
            permissions: [
                { key: Permissions.CALENDAR_VIEW_PERSONAL, label: t("permissions.viewPersonalCalendar") },
                { key: Permissions.CALENDAR_VIEW_FIRM, label: t("permissions.viewFirmCalendar"), risk: "medium" },
                { key: Permissions.CALENDAR_MANAGE_OWN, label: t("permissions.manageOwnCalendar") },
                { key: Permissions.CALENDAR_MANAGE_FIRM, label: t("permissions.manageFirmCalendar"), risk: "high" },
            ],
        },
        {
            title: t("groups.reminders") || "Reminders Management",
            permissions: [
                { key: Permissions.REMINDERS_MANAGE_OWN, label: t("permissions.manageOwnReminders") },
                { key: Permissions.REMINDERS_VIEW_FIRM, label: t("permissions.viewFirmReminders") },
                { key: Permissions.REMINDERS_MANAGE_FIRM, label: t("permissions.manageFirmReminders"), risk: "high" },
            ],
        },
        {
            title: t("groups.reports") || "Reports",
            permissions: [
                { key: Permissions.REPORTS_VIEW, label: t("permissions.viewReports") || "View Reports" },
                { key: Permissions.REPORTS_EXPORT, label: t("permissions.exportReports") || "Export Reports" },
            ],
        },
        {
            title: t("groups.firm"),
            permissions: [
                { key: Permissions.FIRM_SETTINGS_VIEW, label: t("permissions.viewSettings") },
                { key: Permissions.FIRM_SETTINGS_MANAGE, label: t("permissions.manageSettings") || "Manage Firm Settings", risk: "high" },
                { key: Permissions.USERS_MANAGE, label: t("permissions.manageUsers"), risk: "high" },
                { key: Permissions.ROLES_MANAGE, label: t("permissions.manageRoles"), risk: "high" },
                { key: Permissions.PERMISSIONS_MANAGE, label: t("permissions.managePermissions") || "Assign Permissions", risk: "high" },
            ],
        },
    ];

    const togglePerm = (key: string) => {
        setSelectedPerms(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    return (
        <div className="bg-white rounded-[25px] border border-gray-100 overflow-hidden relative">
            <AlertContainer alerts={alerts} onClose={closeAlert} />
            {/* Header Section */}
            <div className="p-8 md:p-10 border-b border-gray-100 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t("roleName")}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("placeholder")}
                            className={cn(
                                "w-full px-6 h-14 text-[15px] font-bold text-gray-900 border-none rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400",
                            )}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t("description") || "Description"}</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descPlaceholder") || "Brief description..."}
                            className={cn(
                                "w-full px-6 h-14 text-[15px] font-medium text-gray-900 border-none rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400",
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Permissions Section */}
            <div className="p-8 md:p-10 bg-[#fafafa]/50 space-y-10">
                {PERMISSION_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-5">
                        <h4 className="flex items-center gap-3 text-sm font-black text-gray-900 uppercase tracking-widest px-1">
                            {group.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                            {group.permissions.map((perm) => {
                                const isSelected = selectedPerms.includes(perm.key);
                                const isHighRisk = (perm as any).risk === "high";

                                return (
                                    <div
                                        key={perm.key}
                                        onClick={() => togglePerm(perm.key)}
                                        className={cn(
                                            "relative cursor-pointer px-5 py-4 rounded-2xl border-2 transition-all duration-200 group select-none flex items-center justify-between gap-4",
                                            isSelected
                                                ? 'bg-white border-transparent scale-[1.02]'
                                                : 'bg-white border-transparent hover:border-brand-primary/30'
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                                            )}>
                                                {isSelected ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className={cn("text-[13px] font-bold leading-tight transition-colors", isSelected ? 'text-gray-900' : 'text-gray-600')}>
                                                    {perm.label}
                                                </p>
                                            </div>
                                        </div>

                                        {isHighRisk && (
                                            <div className="bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100" title={t("highRisk") || "High Risk"}>
                                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {firmId && (
                <div className="p-8 md:p-10 border-t border-gray-100 bg-white">
                    <GranularPermissionEditor
                        firmId={firmId}
                        value={policyResources}
                        onChange={setPolicyResources}
                    />
                </div>
            )}

            {/* Actions Footer */}
            <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                {initialRole ? (
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="h-12 px-6 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-900"
                    >
                        {t("cancel") || "Cancel"}
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setName("");
                            setDescription("");
                            setSelectedPerms([]);
                        }}
                        className="h-12 px-6 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-900"
                    >
                        {t("reset")}
                    </Button>
                )}

                <Button
                    onClick={handleSave}
                    disabled={!name || !firmId || isSaving}
                    loading={isSaving}
                    className="h-14 px-8 rounded-2xl bg-brand-primary hover:opacity-90 text-white font-black text-[15px] tracking-wide"
                >
                    {isSaving ? t("saving") : (initialRole ? (t("saveChanges") || "Save Changes") : (t("createRole") || "Create Role"))}
                </Button>
            </div>
        </div>
    );
}
