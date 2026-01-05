"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    BadgeInfo, Check, Copy, Building2, Upload, Globe, Shield,
    Lock, Edit3, X, Palette, Calendar, Bell, AlertTriangle,
    Trash2, Eye, Mail, UserPlus, Loader2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AccessManagerModal } from "@/components/firm/AccessManagerModal";
import { RoleEditor } from "@/components/firm/RoleEditor";
import { useAlert } from "@/hooks/useAlert";
import AlertContainer from "@/components/ui/AlertContainer";
import AlertModal from "@/components/ui/AlertModal";
import { useAuth } from "@/contexts/AuthContext";

interface Firm {
    id: string;
    name: string;
    nameAr: string;
    email: string;
    phone: string;
    address: string;
    licenseNumber: string;
    licenseUrl?: string;
    licenseExpiry?: string;
    primaryColor: string;
    secondaryColor: string;
    tag: string;
    logoUrl?: string;
    timezone?: string;
    reminderAdvanceNoticeDays: number;
}

export default function FirmSettingsPage() {
    const params = useParams();
    const locale = (params?.locale as string) || "ar";
    const isRTL = locale === "ar";
    const t = useTranslations("firm");

    // State
    const [firm, setFirm] = useState<Firm | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [isEditing, setIsEditing] = useState(false);
    const { refreshUser } = useAuth();

    // Branding Colors State
    const [availablePrimaryColors, setAvailablePrimaryColors] = useState<string[]>([]);
    const [availableSecondaryColors, setAvailableSecondaryColors] = useState<string[]>([]);

    // Roles State
    const [editingRole, setEditingRole] = useState<any>(null);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

    // ... (rest of the state)

    function handleDeleteRole(roleId: string) {
        setRoleToDelete(roleId);
    }

    async function confirmDeleteRole() {
        if (!roleToDelete) return;

        try {
            const res = await fetch(`/api/firms/${firm?.id}/roles/${roleToDelete}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchData();
                success(t("general.success") || "Role deleted successfully");
            } else {
                const data = await res.json();
                showError(data.message || t("general.error"));
            }
        } catch (error) {
            showError(t("general.error"));
        } finally {
            setRoleToDelete(null);
        }
    }

    // ... (rest of the component)

    // Danger Zone State
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    // Modal State
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    // Upload Loading States
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);

    // Custom Alerts
    const { alerts, success, error: showError, closeAlert } = useAlert();

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/auth/me");
            const meData = await meRes.json();
            const fId = meData?.user?.firmId;

            if (fId) {
                const [firmRes, usersRes, rolesRes] = await Promise.all([
                    fetch(`/api/firms/${fId}`),
                    fetch(`/api/firms/${fId}/users`),
                    fetch(`/api/firms/${fId}/roles`)
                ]);

                if (firmRes.ok && usersRes.ok && rolesRes.ok) {
                    const fData = await firmRes.json();
                    const uData = await usersRes.json();
                    const rData = await rolesRes.json();

                    setFirm(fData.firm);
                    setUsers(uData.members || []);
                    setRoles(rData.roles || []);
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrandingColors = async () => {
        try {
            const res = await fetch("/api/admin/branding-colors");
            if (res.ok) {
                const data = await res.json();
                setAvailablePrimaryColors(data.primary || []);
                setAvailableSecondaryColors(data.secondary || []);
            }
        } catch (error) {
            console.error("Failed to fetch branding colors:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchBrandingColors();
    }, []);

    async function handleUpdateFirm(e: React.FormEvent) {
        e.preventDefault();
        if (!firm?.id) return;

        setIsUpdating(true);
        try {
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const data = {
                name: formData.get("name"),
                nameAr: formData.get("nameAr"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                address: formData.get("address"),
                licenseNumber: formData.get("licenseNumber"),
                licenseExpiry: formData.get("licenseExpiry"),
                primaryColor: formData.get("primaryColor"),
                secondaryColor: formData.get("secondaryColor"),
                reminderAdvanceNoticeDays: parseInt(formData.get("reminderAdvanceNoticeDays") as string),
                timezone: formData.get("timezone"),
                logoUrl: firm.logoUrl,
                licenseUrl: firm.licenseUrl
            };

            const res = await fetch(`/api/firms/${firm.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const updated = await res.json();
                await fetchData();
                await refreshUser(); // Update global auth context to reflect color changes immediately
                setIsEditing(false);
                success(t("general.success"));
            } else {
                showError(t("general.error"));
            }
        } catch (error) {
            console.error(error);
            showError(t("general.error"));
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'license') {
        const file = e.target.files?.[0];
        if (!file || !firm?.id) return;

        if (file.size > 5 * 1024 * 1024) {
            showError(locale === 'ar' ? 'حجم الملف كبير جداً (5MB كحد أقصى)' : 'File too large (max 5MB)');
            return;
        }

        if (type === 'logo') setIsUploadingLogo(true);
        else setIsUploadingLicense(true);

        try {
            if (type === 'license') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('firmId', firm.id);

                const res = await fetch(`/api/upload/firm-${type}`, {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    setFirm(prev => prev ? { ...prev, licenseUrl: data.url } : null);
                    success(t("general.success"));
                } else {
                    showError(t("general.error"));
                }
                setIsUploadingLicense(false);
            } else {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const res = await fetch(`/api/upload/firm-${type}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fileData: reader.result,
                            firmId: firm.id
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setFirm(prev => prev ? { ...prev, logoUrl: data.url } : null);
                        success(t("general.success"));
                    } else {
                        showError(t("general.error"));
                    }
                    setIsUploadingLogo(false);
                };
            }
        } catch (error) {
            console.error(error);
            showError(t("general.error"));
            if (type === 'logo') setIsUploadingLogo(false);
            else setIsUploadingLicense(false);
        }
    }

    const handleSendOtp = async () => {
        setOtpLoading(true);
        try {
            if (!firm?.id) return;

            const res = await fetch(`/api/firms/${firm.id}/delete-otp`, {
                method: "POST"
            });

            if (res.ok) {
                setShowOtp(true);
                success(locale === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email');
            } else {
                const data = await res.json();
                showError(data.message || t("general.error"));
            }
        } catch (err) {
            console.error(err);
            showError(t("general.error"));
        } finally {
            setOtpLoading(false);
        }
    };

    const router = useRouter();

    const handleDeleteFirm = async () => {
        if (!firm?.id) return;
        if (otp.length !== 6) {
            showError(locale === 'ar' ? 'الرجاء إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code');
            return;
        }

        try {
            const res = await fetch(`/api/firms/${firm.id}?otp=${otp}`, {
                method: "DELETE",
            });

            if (res.ok) {
                success(locale === 'ar' ? 'تم حذف المكتب بنجاح' : 'Firm deleted successfully');
                // Force reload/redirect to selection
                window.location.href = `/${locale}/select-mode`;
            } else {
                const data = await res.json();
                showError(data.message || t("general.error"));
            }
        } catch (error) {
            showError(t("general.error"));
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 pb-20 select-none" dir={isRTL ? "rtl" : "ltr"}>
            <AlertContainer alerts={alerts} onClose={closeAlert} />
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900">{t("title")}</h1>
                    <p className="text-gray-500 text-[15px] font-medium">{t("subtitle")}</p>
                </div>
                {activeTab === "general" && (
                    <Button
                        variant={isEditing ? "outline" : "primary"}
                        onClick={() => setIsEditing(!isEditing)}
                        className="rounded-2xl h-12 px-6 font-bold"
                    >
                        {isEditing ? (
                            <><X className="w-4 h-4 me-2" /> {t("general.cancel")}</>
                        ) : (
                            <><Edit3 className="w-4 h-4 me-2" /> {t("general.edit")}</>
                        )}
                    </Button>
                )}
            </div>

            <Tabs activeValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start rounded-none w-full border-b border-gray-100 mb-8">
                    {[
                        { id: "general", label: "tabs.general", icon: BadgeInfo },
                        { id: "members", label: "tabs.members", icon: Building2 },
                        { id: "roles", label: "tabs.roles", icon: Shield },
                        { id: "security", label: "tabs.security", icon: Lock },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                activeValue={activeTab}
                                onValueChange={setActiveTab}
                                className={cn(
                                    "relative px-0 py-4 h-full bg-transparent border-none rounded-none text-[15px] font-bold transition-all shadow-none",
                                    isActive ? "text-brand-primary" : "text-gray-400 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", isActive ? "text-brand-primary" : "text-gray-300")} />
                                    {t(tab.label)}
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full"
                                    />
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                <TabsContent value="general" activeValue={activeTab} className="mt-0 space-y-10 outline-none">
                    <form onSubmit={handleUpdateFirm}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Identity & Assets */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Logo Card */}
                                <div className="bg-white rounded-[32px] p-8 border border-gray-100 flex flex-col items-center text-center">
                                    <div className="relative group mb-6">
                                        <div className="w-32 h-32 rounded-[32px] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner group-hover:border-blue-200 transition-all">
                                            {isUploadingLogo ? (
                                                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                                            ) : firm?.logoUrl ? (
                                                <img src={firm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 className="w-12 h-12 text-slate-300" />
                                            )}
                                        </div>
                                        {isEditing && !isUploadingLogo && (
                                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:opacity-90 transition-all hover:scale-110 active:scale-95 border-4 border-white">
                                                <Upload className="w-5 h-5" />
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                            </label>
                                        )}
                                    </div>
                                    <h4 className="font-black text-gray-900 text-lg mb-1">{t("general.logo")}</h4>
                                    <p className="text-[13px] text-gray-500 font-medium px-4">{t("general.logoDescription")}</p>
                                </div>

                                {/* Brand Color */}
                                <div className="bg-white rounded-[32px] p-8 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-gray-900">{t("general.color")}</h4>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(availablePrimaryColors.length > 0 ? availablePrimaryColors : ["#1e40af", "#7c3aed", "#ec4899", "#ef4444", "#f59e0b", "#05a36e", "#06b6d4", "#64748b", "#3b82f6"]).map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setFirm(f => f ? { ...f, primaryColor: c } : null)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl transition-all border-4",
                                                            firm?.primaryColor === c ? "border-slate-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    name="primaryColor"
                                                    value={firm?.primaryColor || "#1e40af"}
                                                    onChange={(e) => setFirm(f => f ? { ...f, primaryColor: e.target.value } : null)}
                                                    className="h-12 pl-12 font-mono uppercase"
                                                />
                                                <div
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border border-gray-200"
                                                    style={{ backgroundColor: firm?.primaryColor }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl border border-gray-100" style={{ backgroundColor: firm?.primaryColor }} />
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase font-mono">{firm?.primaryColor}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("general.colorDescription")}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Secondary Sidebar Color */}
                                <div className="bg-white rounded-[32px] p-8 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-gray-900">{t("general.secondaryColor")}</h4>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(availableSecondaryColors.length > 0 ? availableSecondaryColors : ["#0f172a", "#1e293b", "#111827", "#171717", "#000000", "#1a1a1a", "#0c0e12", "#020617"]).map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setFirm(f => f ? { ...f, secondaryColor: c } : null)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl transition-all border-4",
                                                            firm?.secondaryColor === c ? "border-brand-primary scale-110 shadow-md" : "border-transparent hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    name="secondaryColor"
                                                    value={firm?.secondaryColor || "#0f172a"}
                                                    onChange={(e) => setFirm(f => f ? { ...f, secondaryColor: e.target.value } : null)}
                                                    className="h-12 pl-12 font-mono uppercase"
                                                />
                                                <div
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border border-gray-200"
                                                    style={{ backgroundColor: firm?.secondaryColor }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl border border-gray-100 shadow-sm" style={{ backgroundColor: firm?.secondaryColor }} />
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase font-mono">{firm?.secondaryColor}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("general.secondaryColorDescription")}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tag Info */}
                                <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                                    <h3 className="font-black text-lg mb-2">{t("general.firmTag")}</h3>
                                    <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">{t("general.tagDescription")}</p>
                                    <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-[20px] flex items-center justify-between border border-white/10 group">
                                        <span className="text-xl font-mono font-black text-brand-primary/60">@{firm?.tag}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`@${firm?.tag}`);
                                                alert(t("general.success"));
                                            }}
                                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Core Details & License */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-[32px] p-10 border border-gray-100 space-y-10">
                                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("general.name")} (EN)</label>
                                            {isEditing ? (
                                                <Input name="name" defaultValue={firm?.name} className="h-14 font-bold rounded-2xl" placeholder="Full English Name" />
                                            ) : (
                                                <p className="text-lg font-black text-gray-900 h-8 flex items-center">{firm?.name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("general.name")} (AR)</label>
                                            {isEditing ? (
                                                <Input name="nameAr" defaultValue={firm?.nameAr} dir="rtl" className="h-14 font-bold rounded-2xl text-right" placeholder="الاسم الكامل بالعربية" />
                                            ) : (
                                                <p className="text-lg font-black text-gray-900 h-8 flex items-center" dir="rtl">{firm?.nameAr}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("general.email")}</label>
                                            {isEditing ? (
                                                <Input name="email" type="email" defaultValue={firm?.email} className="h-14 font-bold rounded-2xl" />
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-900">
                                                    <Mail className="w-4 h-4 text-slate-300" />
                                                    <p className="font-bold">{firm?.email}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("general.phone")}</label>
                                            {isEditing ? (
                                                <Input name="phone" defaultValue={firm?.phone} className="h-14 font-bold rounded-2xl" />
                                            ) : (
                                                <p className="font-bold text-gray-900">{firm?.phone || "—"}</p>
                                            )}
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("general.address")}</label>
                                            {isEditing ? (
                                                <Input name="address" defaultValue={firm?.address} className="h-14 font-bold rounded-2xl" />
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-900">
                                                    <Globe className="w-4 h-4 text-slate-300" />
                                                    <p className="font-bold">{firm?.address || "—"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-50 w-full" />

                                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Shield className="w-3 h-3" /> {t("general.licenseNumber")}
                                            </label>
                                            {isEditing ? (
                                                <Input name="licenseNumber" defaultValue={firm?.licenseNumber} className="h-14 font-bold rounded-2xl" />
                                            ) : (
                                                <p className="font-black text-slate-900 tracking-wider">{firm?.licenseNumber || "—"}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> {t("general.licenseExpiry")}
                                            </label>
                                            {isEditing ? (
                                                <Input name="licenseExpiry" type="date" defaultValue={firm?.licenseExpiry?.split('T')[0]} className="h-14 font-bold rounded-2xl" />
                                            ) : (
                                                <p className="font-bold text-slate-900">{firm?.licenseExpiry ? new Date(firm.licenseExpiry).toLocaleDateString() : "—"}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Bell className="w-3 h-3" /> {t("general.reminderDays")}
                                            </label>
                                            {isEditing ? (
                                                <div className="flex items-center gap-4">
                                                    <Input name="reminderAdvanceNoticeDays" type="number" defaultValue={firm?.reminderAdvanceNoticeDays || 7} className="h-14 font-bold rounded-2xl" />
                                                    <span className="text-sm font-black text-slate-400 uppercase">{locale === 'ar' ? 'يوم' : 'Days'}</span>
                                                </div>
                                            ) : (
                                                <p className="font-bold text-slate-900">{firm?.reminderAdvanceNoticeDays || 7} {locale === 'ar' ? 'يوم' : 'Days'}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Globe className="w-3 h-3" /> {t("general.timezone")}
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    name="timezone"
                                                    defaultValue={firm?.timezone || "UTC"}
                                                    className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold appearance-none"
                                                >
                                                    <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                                                    <option value="Asia/Dubai">Dubai (GMT+4)</option>
                                                    <option value="UTC">UTC</option>
                                                </select>
                                            ) : (
                                                <p className="font-bold text-slate-900">{firm?.timezone || "UTC"}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* License Download Button if exists or upload if editing */}
                                    <div className="pt-4 flex flex-wrap gap-4">
                                        {firm?.licenseUrl && (
                                            <Button variant="outline" type="button" onClick={() => window.open(firm.licenseUrl)} className="rounded-2xl h-12 border-slate-200 hover:bg-slate-50">
                                                <Eye className="w-4 h-4 me-2" />
                                                {locale === 'ar' ? 'عرض الرخصة' : 'View License'}
                                            </Button>
                                        )}
                                        {isEditing && (
                                            isUploadingLicense ? (
                                                <div className="flex items-center gap-2 px-6 h-12 rounded-2xl border-2 border-dashed border-brand-primary/20 text-brand-primary font-bold text-sm bg-brand-primary/5">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-6 h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-600 font-bold text-sm cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all bg-slate-50/50">
                                                    <Upload className="w-4 h-4" />
                                                    {firm?.licenseUrl ? (locale === 'ar' ? 'تغيير الرخصة' : 'Change License') : t("general.license")}
                                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'license')} />
                                                </label>
                                            )
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {isEditing && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="flex justify-end pt-10"
                                            >
                                                <Button type="submit" loading={isUpdating} className="px-12 h-14 rounded-2xl shadow-xl shadow-brand-primary/20 font-black uppercase tracking-widest bg-brand-primary">
                                                    {t("general.save")}
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50/30 rounded-[32px] p-10 border border-red-100/50 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-red-950">{t("general.dangerZone")}</h3>
                                            <p className="text-red-600/70 text-sm font-bold uppercase tracking-widest">{t("general.dangerZoneSubtitle")}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-red-50">
                                        <div className="text-center md:text-start">
                                            <h4 className="font-black text-red-950">{t("general.deleteFirm")}</h4>
                                            <p className="text-sm font-medium text-slate-500 max-w-sm">{t("general.deleteFirmDesc")}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleSendOtp}
                                            loading={otpLoading}
                                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-black h-12"
                                        >
                                            <Trash2 className="w-4 h-4 me-2" />
                                            {t("general.deleteFirm")}
                                        </Button>
                                    </div>

                                    <AnimatePresence>
                                        {showOtp && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="space-y-4 overflow-hidden pt-4"
                                            >
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                                    <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                    <p className="text-sm text-amber-800 font-bold">{t("general.otpSent")}</p>
                                                </div>
                                                <div className="flex gap-4 p-1">
                                                    <Input
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        placeholder="000000"
                                                        className="h-14 rounded-2xl font-black text-center text-2xl tracking-[1em]"
                                                        maxLength={6}
                                                    />
                                                    <Button onClick={handleDeleteFirm} className="h-14 px-10 rounded-2xl bg-red-600 hover:bg-red-700 font-black">
                                                        {t("general.verify")}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="members" activeValue={activeTab} className="outline-none">
                    <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{t("tabs.members")}</h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("members.subtitle")}</p>
                            </div>
                            <Button variant="outline" className="h-12 px-6 rounded-2xl font-black border-slate-200 hover:bg-slate-50" onClick={() => setIsAccessModalOpen(true)}>
                                <UserPlus className="w-4 h-4 me-2" />
                                {t("members.invite")}
                            </Button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <div key={user.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-2xl overflow-hidden">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                user.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-gray-900 mb-0.5">{user.name}</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-bold text-gray-400 font-mono tracking-tight">{user.email}</p>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span className="text-xs font-black text-brand-primary uppercase tracking-widest">
                                                    {roles.find(r => r.id === user.roleId)?.name || "Member"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest">
                                            {t("members.active")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="roles" activeValue={activeTab} className="outline-none">
                    <div className="bg-white rounded-[40px] p-2 border border-gray-100 box-content overflow-hidden">
                        {isCreatingRole || editingRole ? (
                            <div className="p-6">
                                <div className="mb-6 px-4">
                                    <button
                                        onClick={() => { setIsCreatingRole(false); setEditingRole(null); }}
                                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        <div className="bg-gray-100 p-1 rounded-lg"><X className="w-4 h-4" /></div>
                                        {t("general.back")}
                                    </button>
                                </div>
                                <RoleEditor
                                    firmId={firm?.id || null}
                                    initialRole={editingRole}
                                    onSave={() => {
                                        fetchData();
                                        setIsCreatingRole(false);
                                        setEditingRole(null);
                                    }}
                                    onCancel={() => {
                                        setIsCreatingRole(false);
                                        setEditingRole(null);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{t("tabs.roles")}</h3>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("roles.subtitle") || "Manage firm roles & permissions"}</p>
                                    </div>
                                    <Button onClick={() => setIsCreatingRole(true)} className="h-12 px-6 rounded-2xl font-black shadow-lg shadow-brand-primary/20 bg-brand-primary">
                                        <Shield className="w-4 h-4 me-2" />
                                        {t("roles.createRole") || "Create Role"}
                                    </Button>
                                </div>

                                <div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] overflow-hidden border border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-start text-[12px] font-semibold text-gray-600 uppercase">{t("roleName")}</th>
                                                    <th className="px-6 py-4 text-start text-[12px] font-semibold text-gray-600 uppercase">{t("description") || "Description"}</th>
                                                    <th className="px-6 py-4 text-center text-[12px] font-semibold text-gray-600 uppercase">{t("permissions") || "Permissions"}</th>
                                                    <th className="px-6 py-4 text-end text-[12px] font-semibold text-gray-600 uppercase"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {roles.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-gray-500">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                                    <Shield className="h-6 w-6 text-gray-400" />
                                                                </div>
                                                                <h3 className="text-[14px] font-medium text-gray-900 mb-1">{t("roles.noRoles")}</h3>
                                                                <p className="text-[12px] text-gray-500">{t("roles.noRolesDesc")}</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : roles.map((role) => (
                                                    <tr key={role.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <span className="font-semibold text-gray-900 text-sm">{role.name}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-500 line-clamp-1 max-w-md">
                                                                {role.description || <span className="text-gray-300 italic">{t("roles.noDescription") || "No description provided"}</span>}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                                                                {role.permissions?.length || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-end">
                                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setEditingRole(role)}
                                                                    className="h-8 w-8 p-0 inline-flex items-center justify-center text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRole(role.id)}
                                                                    className="h-8 w-8 p-0 inline-flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="security" activeValue={activeTab} className="outline-none">
                    <div className="bg-white rounded-[40px] py-32 text-center border border-gray-100 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-[24px] flex items-center justify-center mb-8">
                            <Lock className="w-6 h-6 text-slate-900" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">{t("security.title")}</h3>
                        <p className="text-slate-500 max-w-[400px] mx-auto leading-[1.2] font-medium text-base mb-10">
                            {t("security.description")}
                        </p>
                        <div className="transform hover:scale-110 transition-transform">
                            <span className="px-8 py-3 bg-brand-primary text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em]">
                                {t("security.comingSoon")}
                            </span>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Access Manager Modal */}
            <AccessManagerModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                users={users}
                roles={roles}
                firmId={firm?.id || null}
                onSuccess={fetchData}
            />

            <AlertModal
                isOpen={!!roleToDelete}
                type="warning"
                title={t("roles.deleteTitle") || "Delete Role"}
                message={t("roles.deleteConfirm") || "Are you sure you want to delete this role? This action cannot be undone."}
                onClose={() => setRoleToDelete(null)}
                onConfirm={confirmDeleteRole}
                confirmText={t("roles.delete") || "Delete"}
                cancelText={t("general.cancel") || "Cancel"}
            />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
