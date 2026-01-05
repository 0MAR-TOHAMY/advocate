"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Building2, Save } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ImageUpload from "@/components/ui/ImageUpload";

const TIMEZONES = [
    { value: "Asia/Dubai", label: "Asia/Dubai" },
    { value: "Asia/Riyadh", label: "Asia/Riyadh" },
    { value: "Africa/Cairo", label: "Africa/Cairo" },
    { value: "Asia/Qatar", label: "Asia/Qatar" },
    { value: "Asia/Kuwait", label: "Asia/Kuwait" },
    { value: "Asia/Muscat", label: "Asia/Muscat" },
    { value: "Asia/Bahrain", label: "Asia/Bahrain" },
    { value: "Asia/Amman", label: "Asia/Amman" },
    { value: "Asia/Baghdad", label: "Asia/Baghdad" },
    { value: "Africa/Algiers", label: "Africa/Algiers" },
    { value: "Africa/Casablanca", label: "Africa/Casablanca" },
    { value: "Africa/Tunis", label: "Africa/Tunis" },
    { value: "UTC", label: "UTC" },
];

export default function FirmSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "ar";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [firmId, setFirmId] = useState("");

    const [name, setName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [timezone, setTimezone] = useState("Asia/Dubai");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");

    const t = {
        title: locale === "ar" ? "إعدادات المكتب" : "Firm Settings",
        subtitle: locale === "ar" ? "تحديث معلومات المكتب" : "Update firm details",
        name: locale === "ar" ? "اسم المكتب *" : "Firm Name *",
        logo: locale === "ar" ? "شعار المكتب" : "Firm Logo",
        timezone: locale === "ar" ? "المنطقة الزمنية *" : "Timezone *",
        address: locale === "ar" ? "العنوان" : "Address",
        phone: locale === "ar" ? "الهاتف" : "Phone",
        email: locale === "ar" ? "البريد الإلكتروني" : "Email",
        license: locale === "ar" ? "رقم الترخيص" : "License Number",
        save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
        success: locale === "ar" ? "تم الحفظ بنجاح!" : "Saved successfully!",
        required: locale === "ar" ? "هذا الحقل مطلوب" : "This field is required",
    };

    useEffect(() => {
        async function fetchFirm() {
            try {
                const meRes = await fetch("/api/auth/me");
                const meData = await meRes.json();
                const fId = meData?.user?.firmId || "";
                setFirmId(fId);

                if (!fId) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(`/api/firms/${fId}`);
                if (res.ok) {
                    const data = await res.json();
                    const firm = data.firm;
                    if (firm) {
                        setName(firm.name || "");
                        setLogoUrl(firm.logoUrl || "");
                        setTimezone(firm.timezone || "Asia/Dubai");
                        setAddress(firm.address || "");
                        setPhone(firm.phone || "");
                        setEmail(firm.email || "");
                        setLicenseNumber(firm.licenseNumber || "");
                    }
                }
            } catch {
                // Continue with empty form
            } finally {
                setLoading(false);
            }
        }
        fetchFirm();
    }, []);

    async function handleLogoUpload(file: File) {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "advocate/logos");
        form.append("resourceType", "image");
        form.append("tags", "firm_logo");

        try {
            const res = await fetch("/api/uploads/cloudinary", { method: "POST", body: form });
            if (res.ok) {
                const data = await res.json();
                setLogoUrl(data.secureUrl || data.url || "");
            }
        } catch {
            // Ignore upload errors
        }
    }

    async function handleSave() {
        if (!name.trim()) {
            setError(t.required);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch(`/api/firms/${firmId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    logoUrl,
                    timezone,
                    address,
                    phone,
                    email,
                    licenseNumber,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Error");
            }
        } catch {
            setError(locale === "ar" ? "حدث خطأ" : "An error occurred");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-500 text-[14px]">{t.subtitle}</p>
            </div>

            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-8">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Name */}
                    <div className="md:col-span-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.name}
                            className="w-full"
                        />
                    </div>

                    {/* Logo */}
                    <div className="md:col-span-2">
                        <ImageUpload
                            label={t.logo}
                            type="cover"
                            currentImage={logoUrl || null}
                            onUpload={handleLogoUpload}
                        />
                    </div>

                    {/* Timezone */}
                    <Select
                        value={timezone}
                        onChange={(v) => setTimezone(v)}
                        options={TIMEZONES}
                    />

                    {/* License */}
                    <Input
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder={t.license}
                    />

                    {/* Address */}
                    <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t.address}
                    />

                    {/* Phone */}
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phone}
                    />

                    {/* Email */}
                    <div className="md:col-span-2">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.email}
                            type="email"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-600 text-sm mt-4">{error}</p>
                )}

                {/* Success */}
                {success && (
                    <p className="text-emerald-600 text-sm mt-4 font-medium">{t.success}</p>
                )}

                {/* Submit */}
                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleSave}
                        loading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {t.save}
                    </Button>
                </div>
            </div>
        </div>
    );
}
