"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Search, Shield, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useAlert } from "@/hooks/useAlert";
import AlertContainer from "@/components/ui/AlertContainer";

interface UserType {
    id: string;
    name: string;
    email: string;
    roleId?: string;
    role?: string;
    avatarUrl?: string | null;
}

interface AccessManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: UserType[];
    roles: any[];
    firmId: string | null;
    onSuccess: () => void;
}

export function AccessManagerModal({ isOpen, onClose, users, roles, firmId, onSuccess }: AccessManagerModalProps) {
    const t = useTranslations("firm.accessManager");
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { alerts, showAlert, closeAlert } = useAlert();

    const handleGrant = async () => {
        if (!firmId || !selectedUser || !selectedRoleId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/firms/${firmId}/users/${selectedUser.id}`, {
                method: "PATCH",
                body: JSON.stringify({ roleId: selectedRoleId }),
            });
            if (res.ok) {
                showAlert("success", t("success") || "Permissions granted successfully");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                showAlert("error", t("failed") || "Failed to grant permissions");
            }
        } catch (e) {
            showAlert("error", t("error") || "An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[30px] bg-white p-8 text-start align-middle shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] transition-all relative">
                                <AlertContainer alerts={alerts} onClose={closeAlert} />
                                <div className="flex justify-between items-center mb-8">
                                    <Dialog.Title as="h3" className="text-[20px] font-bold text-gray-900 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-[12px] bg-blue-50 flex items-center justify-center text-[#2E71E5]">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        {t("title")}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: User Selection */}
                                    <div className="space-y-4">
                                        <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide">{t("selectUser")}</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder={t("searchUser") || "Search user..."}
                                                className={cn(
                                                    "w-full pl-11 rtl:pr-11 rtl:pl-4 pr-4 h-[50px] border border-gray-200 rounded-[15px] bg-gray-50/50",
                                                    "focus:ring-2 focus:ring-[#2E71E5] focus:border-transparent outline-none transition-all"
                                                )}
                                            />
                                        </div>
                                        <div className="h-[320px] overflow-y-auto border border-gray-100 rounded-[20px] p-2 bg-gray-50/30 scrollbar-thin">
                                            {users.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedRoleId(user.roleId || null);
                                                    }}
                                                    className={cn(
                                                        "p-3 mb-2 flex items-center gap-3 cursor-pointer transition-all rounded-[15px]",
                                                        selectedUser?.id === user.id ? 'bg-white border border-blue-100' : 'hover:bg-white hover:shadow-sm border border-transparent'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors overflow-hidden",
                                                        selectedUser?.id === user.id ? "bg-[#2E71E5] text-white" : "bg-blue-100 text-[#2E71E5]"
                                                    )}>
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name?.charAt(0) || "?"
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-[14px] font-medium", selectedUser?.id === user.id ? "text-[#2E71E5]" : "text-gray-900")}>{user.name}</div>
                                                        <div className="text-[12px] text-gray-500">{user.email}</div>
                                                    </div>
                                                    {selectedUser?.id === user.id && <Check className="ms-auto h-4 w-4 text-[#2E71E5]" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Role Selection */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-3">{t("selectRole")}</label>
                                            <div className="space-y-3 h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                                {roles.map((role) => (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => setSelectedRoleId(role.id)}
                                                        className={cn(
                                                            "p-4 border rounded-[18px] cursor-pointer transition-all",
                                                            selectedRoleId === role.id
                                                                ? 'border-[#2E71E5] bg-blue-50/30 ring-1 ring-[#2E71E5]'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={cn(
                                                                "font-medium text-[14px]",
                                                                selectedRoleId === role.id ? 'text-[#2E71E5]' : 'text-gray-900'
                                                            )}>{role.name}</span>
                                                            {selectedRoleId === role.id && <Check className="h-4 w-4 text-[#2E71E5]" />}
                                                        </div>
                                                        <p className="text-[12px] text-gray-500 line-clamp-2">{role.description || "No description"}</p>
                                                    </div>
                                                ))}
                                                {roles.length === 0 && (
                                                    <div className="text-center text-gray-500 py-10 text-sm">{t("noRoles")}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700 h-[50px]!"
                                    >
                                        {t("cancel")}
                                    </Button>
                                    <Button
                                        disabled={!selectedUser || !selectedRoleId || isSaving}
                                        onClick={handleGrant}
                                        className="shadow-lg shadow-blue-200 h-[50px]!"
                                    >
                                        {isSaving ? (t("saving") || "Saving...") : t("grant")}
                                    </Button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
