/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/ui/FormGroup";
import LoadingModal from "@/components/ui/LoadingModal";
import Loader from "@/components/ui/Loader";
import AlertContainer from "@/components/ui/AlertContainer";
import FloatingSidebar from "@/components/ui/FloatingSidebar";
import { useAlert } from "@/hooks/useAlert";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { Building2 } from "lucide-react";
import {
    Pencil,
    User,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    Clock,
    Settings,
    Globe,
    Moon,
    Bell,
    Archive,
    Camera,
    X,
    Shield,
    CheckCircle,
    XCircle
} from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    avatarUrl?: string;
    coverUrl?: string;
    role?: string;
    firmName?: string;
    firmNameAr?: string;
    createdAt?: string;
    lastLoginAt?: string;
    isVerified?: boolean;
    googleId?: string;
    loginMethod?: string;
    preferences?: {
        language?: "ar" | "en";
        theme?: "light" | "dark" | "system";
        notifications?: boolean;
        autoArchive?: boolean;
    };
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const lang = (params.locale as string) || "ar";
    const { t, dir } = useTranslation();
    const { user, loading: authLoading, logout: authLogout, refreshUser, updateUser, updatePreferences: updatePrefsContext, authenticatedFetch } = useAuth();
    const { alerts, success, error, closeAlert } = useAlert();

    const [saving, setSaving] = useState(false);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingPrefs, setIsEditingPrefs] = useState(false);
    const [loadingModal, setLoadingModal] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    // Firm state
    const [firmName, setFirmName] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");

    // Preferences state
    const [language, setLanguage] = useState<"ar" | "en">("ar");
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
    const [notifications, setNotifications] = useState(true);
    const [autoArchive, setAutoArchive] = useState(false);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Sync form state with user data from context
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhone(user.phone || "");
            setDepartment(user.department || "");
            setPosition(user.position || "");

            if (user.preferences) {
                setLanguage(user.preferences.language || "ar");
                setTheme(user.preferences.theme || "system");
                setNotifications(user.preferences.notifications ?? true);
                setAutoArchive(user.preferences.autoArchive ?? false);
            }
        }
    }, [user]);

    // Fetch firm name if user has firmId
    useEffect(() => {
        async function fetchFirmName() {
            if (user?.firmId) {
                try {
                    const res = await authenticatedFetch(`/api/firms/${user.firmId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFirmName(data.firm?.name || null);
                    }
                } catch {
                    // Ignore errors
                }
            } else {
                setFirmName(null);
            }
        }
        fetchFirmName();
    }, [user?.firmId, authenticatedFetch]);


    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setLoadingModal(true);
        setLoadingMessage(t.profile.updatingProfile || "Updating profile...");

        try {
            const res = await authenticatedFetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, department, position }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            // Update context with new data
            updateUser({ name, phone, department, position });

            success(t.profile.updateSuccess);
            setIsEditingInfo(false);
            await refreshUser();
        } catch (err: any) {
            error(err.message);
        } finally {
            setSaving(false);
            setLoadingModal(false);
        }
    }

    async function handlePreferencesSave() {
        setSaving(true);
        setLoadingModal(true);
        setLoadingMessage(t.profile.updatingPreferences || "Updating preferences...");

        try {
            await updatePrefsContext({ language, theme, notifications, autoArchive });

            success(t.profile.preferencesSuccess);
            setIsEditingPrefs(false);

            // Redirect if language changed
            if (language !== lang) {
                router.push(`/${language}//profile`);
            }
        } catch (err: any) {
            error(err.message);
        } finally {
            setSaving(false);
            setLoadingModal(false);
        }
    }

    async function handleLogout() {
        await authLogout();
    }

    async function handleAvatarUpload(file: File) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            error(t.errors.invalidFileType + " (" + t.common.allowedFormats + ": JPG, PNG, GIF, WebP)");
            return Promise.reject(new Error("Invalid file type"));
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            error(t.errors.fileTooLarge + " (" + t.common.maxFileSize + ": 5MB)");
            return Promise.reject(new Error("File too large"));
        }

        setLoadingModal(true);
        setLoadingMessage(t.profile.uploadingAvatar || "Uploading avatar...");

        const reader = new FileReader();
        reader.readAsDataURL(file);

        return new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const res = await authenticatedFetch("/api/upload/avatar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileData: reader.result }),
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    success(t.profile.uploadSuccess);
                    await refreshUser();
                    resolve();
                } catch (err: any) {
                    error(err.message);
                    reject(err);
                } finally {
                    setLoadingModal(false);
                }
            };
        });
    }

    async function handleAvatarRemove() {
        setLoadingModal(true);
        setLoadingMessage(t.profile.removingAvatar || "Removing avatar...");

        try {
            const res = await authenticatedFetch("/api/upload/avatar", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            success(t.profile.deleteSuccess);
            await refreshUser();
        } catch (err: any) {
            error(err.message);
        } finally {
            setLoadingModal(false);
        }
    }

    async function handleCoverUpload(file: File) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            error(t.errors.invalidFileType + " (" + t.common.allowedFormats + ": JPG, PNG, GIF, WebP)");
            return Promise.reject(new Error("Invalid file type"));
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            error(t.errors.fileTooLarge + " (" + t.common.maxFileSize + ": 5MB)");
            return Promise.reject(new Error("File too large"));
        }

        setLoadingModal(true);
        setLoadingMessage(t.profile.uploadingCover || "Uploading cover...");

        const reader = new FileReader();
        reader.readAsDataURL(file);

        return new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const res = await authenticatedFetch("/api/upload/cover", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileData: reader.result }),
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    success(t.profile.uploadSuccess);
                    await refreshUser();
                    resolve();
                } catch (err: any) {
                    error(err.message);
                    reject(err);
                } finally {
                    setLoadingModal(false);
                }
            };
        });
    }

    async function handleCoverRemove() {
        setLoadingModal(true);
        setLoadingMessage(t.profile.removingCover || "Removing cover...");

        try {
            const res = await authenticatedFetch("/api/upload/cover", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            success(t.profile.deleteSuccess);
            await refreshUser();
        } catch (err: any) {
            error(err.message);
        } finally {
            setLoadingModal(false);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            error(t.auth.resetPassword.passwordMismatch);
            return;
        }

        if (newPassword.length < 8) {
            error(t.errors.passwordTooShort);
            return;
        }

        setSaving(true);
        setLoadingModal(true);
        setLoadingMessage("Changing password...");

        try {
            const res = await authenticatedFetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to change password");
            }

            success(data.message || "Password changed successfully");
            setShowChangePasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err: any) {
            error(err.message);
        } finally {
            setSaving(false);
            setLoadingModal(false);
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <LoadingModal isOpen={loadingModal} message={loadingMessage} />
            <AlertContainer alerts={alerts} onClose={closeAlert} position="top-center" />
            <FloatingSidebar
                onLogout={handleLogout}
                logoutText={t.profile.logout}
                onChangePassword={() => setShowChangePasswordModal(true)}
                changePasswordText={t.profile.changePassword}
            />

            <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden" dir={dir}>
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-40">
                    {/* Pixel Dot Pattern */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(100, 150, 255, 0.5) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* Soft Blue Glowing Lights - Multiple scattered across screen */}
                    <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float-slow" />
                    <div className="absolute top-20 right-20 w-48 h-48 bg-blue-200/45 rounded-full blur-3xl animate-float-medium"
                        style={{ animationDelay: '2s' }} />
                    <div className="absolute bottom-32 left-1/4 w-56 h-56 bg-blue-200/45 rounded-full blur-3xl animate-float-fast"
                        style={{ animationDelay: '4s' }} />
                    <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-blue-200/45 rounded-full blur-3xl animate-float-slow"
                        style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-20 right-32 w-60 h-60 bg-blue-200/45 rounded-full blur-3xl animate-float-medium"
                        style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 left-16 w-52 h-52 bg-blue-200/45 rounded-full blur-3xl animate-float-fast"
                        style={{ animationDelay: '5s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="max-w-6xl mx-auto md:p-10 p-4 space-y-6">
                        {/* Cover & Avatar Section */}
                        <div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] overflow-hidden">
                            {/* Cover Image */}
                            <div className="relative h-[200px] bg-blue-500">
                                {user?.coverUrl && (
                                    <img
                                        src={user.coverUrl}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <label className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <Camera size={16} className="text-gray-700" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleCoverUpload(file);
                                        }}
                                    />
                                </label>
                                {user?.coverUrl && (
                                    <button
                                        onClick={handleCoverRemove}
                                        className="absolute top-4 right-14 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                    >
                                        <X size={16} className="text-red-600" />
                                    </button>
                                )}
                            </div>

                            {/* Avatar & Basic Info */}
                            <div className="px-6 pb-6 pt-4">
                                <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
                                    {/* Avatar */}
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_0_rgba(0,0,0,0.1)] bg-gray-200 overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-blue-500">
                                                    <User size={48} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 md:bottom-2 md:right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                            <Pencil size={16} className="text-gray-700" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleAvatarUpload(file);
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Name & Role */}
                                    <div className="flex-1 md:mb-1">
                                        <h2
                                            className={`text-3xl font-bold text-center ${lang === "ar" ? "md:text-right" : "md:text-left"
                                                } text-gray-900`}
                                        >
                                            {user?.name}
                                        </h2>
                                        <p
                                            className={`text-gray-600 mt-0 ${lang === "ar" ? "md:text-right" : "md:text-left"
                                                } text-center`}
                                        >
                                            {user?.position || user?.role}
                                        </p>

                                        {/* Firm Status */}
                                        {user?.firmId && (user?.firmName || user?.firmNameAr) ? (
                                            <Link
                                                href={`/${lang}/dashboard`}
                                                className={`flex items-center gap-2 mt-1 text-[14px] text-blue-600 hover:text-blue-700 transition-colors md:justify-start justify-center`}
                                            >
                                                <Building2 size={14} />
                                                <span className="font-medium">{lang === "ar" ? (user?.firmNameAr || user?.firmName) : user?.firmName}</span>
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/${lang}/onboarding/start`}
                                                className={`flex items-center gap-2 mt-1 text-[14px] text-emerald-600 hover:text-emerald-700 transition-colors md:justify-start justify-center`}
                                            >
                                                <Building2 size={16} />
                                                <span className="font-medium">
                                                    {lang === "ar" ? "انضم إلى مكتب" : "Join a Firm"}
                                                </span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div >

                        {/* Main Content Grid */}
                        < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
                            {/* Left Column - Personal Info */}
                            < div className="lg:col-span-2 space-y-6" >
                                {/* Personal Information Card */}
                                < div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] md:p-10 p-6" >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
                                            <User size={20} />
                                            {t.profile.personalInfo}
                                        </h3>
                                        {!isEditingInfo && (
                                            <Button
                                                onClick={() => setIsEditingInfo(true)}
                                                variant="ghost"
                                                className="flex items-center gap-2 p-0! md:p-3!"
                                            >
                                                <Pencil size={16} className="text-blue-600" />
                                                <span className="hidden md:block">{t.profile.edit}</span>
                                            </Button>
                                        )}
                                    </div>

                                    {
                                        isEditingInfo ? (
                                            <form onSubmit={handleSave} className="space-y-4">
                                                <FormGroup label={t.profile.name}>
                                                    <Input
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                        className="w-full"
                                                    />
                                                </FormGroup>

                                                <FormGroup label={t.profile.phone}>
                                                    <Input
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        type="tel"
                                                        className="w-full"
                                                    />
                                                </FormGroup>

                                                <FormGroup label={t.profile.department}>
                                                    <Input
                                                        value={department}
                                                        onChange={(e) => setDepartment(e.target.value)}
                                                        className="w-full"
                                                    />
                                                </FormGroup>

                                                <FormGroup label={t.profile.position}>
                                                    <Input
                                                        value={position}
                                                        onChange={(e) => setPosition(e.target.value)}
                                                        className="w-full"
                                                    />
                                                </FormGroup>

                                                <div className="flex gap-3 pt-4">
                                                    <Button type="submit" loading={saving}>
                                                        {t.profile.save}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsEditingInfo(false);
                                                            setName(user?.name || "");
                                                            setPhone(user?.phone || "");
                                                            setDepartment(user?.department || "");
                                                            setPosition(user?.position || "");
                                                        }}
                                                    >
                                                        {t.profile.cancel}
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="space-y-4">
                                                <InfoRow icon={<User size={18} />} label={t.profile.name} value={user?.name} />
                                                <InfoRow icon={<Mail size={18} />} label={t.profile.email} value={user?.email} />
                                                <InfoRow icon={<Phone size={18} />} label={t.profile.phone} value={user?.phone || "-"} />
                                                <InfoRow icon={<Briefcase size={18} />} label={t.profile.department} value={user?.department || "-"} />
                                                <InfoRow icon={<Briefcase size={18} />} label={t.profile.position} value={user?.position || "-"} />
                                                <InfoRow
                                                    icon={<Building2 size={18} />}
                                                    label={lang === "ar" ? "اسم المكتب" : "Firm Name"}
                                                    value={(lang === "ar" ? (user?.firmNameAr || user?.firmName) : user?.firmName) || "-"}
                                                />
                                            </div>
                                        )
                                    }
                                </div >

                                {/* Preferences Card */}
                                < div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] md:p-10 p-6" >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
                                            <Settings size={20} />
                                            {t.profile.preferences}
                                        </h3>
                                        {!isEditingPrefs && (
                                            <Button
                                                onClick={() => setIsEditingPrefs(true)}
                                                variant="ghost"
                                                className="flex items-center gap-2 p-0! md:p-3!"
                                            >
                                                <Pencil size={16} className="text-blue-600" />
                                                <span className="hidden md:block">{t.profile.edit}</span>
                                            </Button>
                                        )}
                                    </div>

                                    {
                                        isEditingPrefs ? (
                                            <div className="space-y-4">
                                                <FormGroup label={t.profile.language}>
                                                    <select
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="ar">{t.profile.arabic}</option>
                                                        <option value="en">{t.profile.english}</option>
                                                    </select>
                                                </FormGroup>

                                                <FormGroup label={t.profile.theme}>
                                                    <select
                                                        value={theme}
                                                        onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="light">{t.profile.light}</option>
                                                        <option value="dark">{t.profile.dark}</option>
                                                        <option value="system">{t.profile.system}</option>
                                                    </select>
                                                </FormGroup>

                                                <FormGroup label={t.profile.notifications}>
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications}
                                                            onChange={(e) => setNotifications(e.target.checked)}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <span>{notifications ? t.profile.enabled : t.profile.disabled}</span>
                                                    </label>
                                                </FormGroup>

                                                <FormGroup label={t.profile.autoArchive}>
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={autoArchive}
                                                            onChange={(e) => setAutoArchive(e.target.checked)}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <span>{autoArchive ? t.profile.enabled : t.profile.disabled}</span>
                                                    </label>
                                                </FormGroup>

                                                <div className="flex gap-3 pt-4">
                                                    <Button onClick={handlePreferencesSave} loading={saving}>
                                                        {t.profile.save}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsEditingPrefs(false);
                                                            if (user?.preferences) {
                                                                setLanguage(user.preferences.language || "ar");
                                                                setTheme(user.preferences.theme || "system");
                                                                setNotifications(user.preferences.notifications ?? true);
                                                                setAutoArchive(user.preferences.autoArchive ?? false);
                                                            }
                                                        }}
                                                    >
                                                        {t.profile.cancel}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <InfoRow
                                                    icon={<Globe size={18} />}
                                                    label={t.profile.language}
                                                    value={user?.preferences?.language === "ar" ? t.profile.arabic : t.profile.english}
                                                />
                                                <InfoRow
                                                    icon={<Moon size={18} />}
                                                    label={t.profile.theme}
                                                    value={
                                                        user?.preferences?.theme === "light" ? t.profile.light :
                                                            user?.preferences?.theme === "dark" ? t.profile.dark :
                                                                t.profile.system
                                                    }
                                                />
                                                <InfoRow
                                                    icon={<Bell size={18} />}
                                                    label={t.profile.notifications}
                                                    value={user?.preferences?.notifications ? t.profile.enabled : t.profile.disabled}
                                                />
                                                <InfoRow
                                                    icon={<Archive size={18} />}
                                                    label={t.profile.autoArchive}
                                                    value={user?.preferences?.autoArchive ? t.profile.enabled : t.profile.disabled}
                                                />
                                            </div>
                                        )
                                    }
                                </div >
                            </div >

                            {/* Right Column - Account Info */}
                            < div className="space-y-6" >
                                <div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] md:p-10 p-6">
                                    <h3 className="text-[18px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <Settings size={20} />
                                        {t.profile.accountInfo}
                                    </h3>
                                    <div className="space-y-4">
                                        <InfoRow
                                            icon={<Shield size={18} />}
                                            label={lang === "ar" ? "طريقة التسجيل" : "Registration Method"}
                                            value={
                                                user?.loginMethod === "both"
                                                    ? lang === "ar" ? "البريد الإلكتروني و Google" : "Email & Google"
                                                    : user?.googleId
                                                        ? "Google"
                                                        : lang === "ar" ? "البريد الإلكتروني" : "Email"
                                            }
                                        />
                                        <InfoRow
                                            icon={user?.isVerified ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                                            label={lang === "ar" ? "حالة التوثيق" : "Verification Status"}
                                            value={
                                                <span className={user?.isVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                    {user?.isVerified ? (lang === "ar" ? "موثق ✓" : "Verified ✓") : (lang === "ar" ? "غير موثق" : "Not Verified")}
                                                </span>
                                            }
                                        />
                                        <InfoRow
                                            icon={<Calendar size={18} />}
                                            label={t.profile.memberSince}
                                            value={formatDate(user?.createdAt)}
                                        />
                                        <InfoRow
                                            icon={<Clock size={18} />}
                                            label={t.profile.lastLogin}
                                            value={formatDate(user?.lastLoginAt)}
                                        />
                                    </div>
                                </div>
                            </div >
                        </div >
                    </div >
                </div >
            </div >

            {/* Change Password Modal */}
            {
                showChangePasswordModal && (
                    <div className="fixed inset-0 z-9999 flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setShowChangePasswordModal(false)}
                        />

                        {/* Modal Content */}
                        <div className="relative bg-white rounded-[25px] shadow-[0_0_20px_0_rgba(0,0,0,0.01)] p-8 w-full max-w-md mx-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">{t.profile.changePassword}</h2>
                                <button
                                    onClick={() => setShowChangePasswordModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <FormGroup label={t.profile.currentPassword}>
                                    <PasswordInput
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder={t.profile.currentPassword}
                                    />
                                </FormGroup>

                                <FormGroup label={t.profile.newPassword}>
                                    <PasswordInput
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder={t.profile.newPassword}
                                        minLength={8}
                                    />
                                </FormGroup>

                                <FormGroup label={t.profile.confirmPassword}>
                                    <PasswordInput
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        required
                                        placeholder={t.profile.confirmPassword}
                                        minLength={8}
                                    />
                                </FormGroup>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" loading={saving}>
                                        {t.profile.save}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowChangePasswordModal(false);
                                            setCurrentPassword("");
                                            setNewPassword("");
                                            setConfirmNewPassword("");
                                        }}
                                    >
                                        {t.profile.cancel}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}

// Helper component for displaying info rows
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className="text-gray-500 mt-0.5">{icon}</div>
            <div className="flex-1">
                <div className="text-[12px] md:text-[14px] text-gray-600 mb-0.5">{label}</div>
                <div className="text-[14px] md:text-[16px] text-gray-900 font-medium">{value || "-"}</div>
            </div>
        </div>
    );
}
