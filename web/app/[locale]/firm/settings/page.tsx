/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  FileText,
  Pencil,
  Save,
  X,
  Camera,
  Settings
} from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import ImageUpload from "@/components/ui/ImageUpload";

const TIMEZONES = [
  { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (GMT+3)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (GMT+2)" },
  { value: "Asia/Qatar", label: "Asia/Qatar (GMT+3)" },
  { value: "Asia/Kuwait", label: "Asia/Kuwait (GMT+3)" },
  { value: "Asia/Muscat", label: "Asia/Muscat (GMT+4)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

interface FirmData {
  id: string;
  name: string;
  logoUrl?: string;
  timezone: string;
  currency?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  tag?: string;
  joinCode?: string;
}

// Info Row Component (like profile page)
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{typeof value === "string" ? value || "-" : value}</p>
      </div>
    </div>
  );
}

export default function FirmSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firmId, setFirmId] = useState<string>("");
  const [firm, setFirm] = useState<FirmData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const t = {
    title: locale === "ar" ? "إعدادات المكتب" : "Firm Settings",
    basicInfo: locale === "ar" ? "المعلومات الأساسية" : "Basic Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    legalInfo: locale === "ar" ? "المعلومات القانونية" : "Legal Information",
    firmName: locale === "ar" ? "اسم المكتب" : "Firm Name",
    logo: locale === "ar" ? "شعار المكتب" : "Firm Logo",
    timezone: locale === "ar" ? "المنطقة الزمنية" : "Timezone",
    address: locale === "ar" ? "العنوان" : "Address",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    license: locale === "ar" ? "رقم الترخيص" : "License Number",
    tag: locale === "ar" ? "وسم المكتب" : "Firm Tag",
    joinCode: locale === "ar" ? "رمز الانضمام" : "Join Code",
    edit: locale === "ar" ? "تعديل" : "Edit",
    save: locale === "ar" ? "حفظ" : "Save",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
  };

  useEffect(() => {
    const run = async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const meData = await meRes.json();
        const fId = meData?.user?.firmId || "";
        setFirmId(fId);

        if (!fId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/firms/${fId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const f = data.firm;
          setFirm(f);
          // Initialize form state
          setName(f?.name || "");
          setLogoUrl(f?.logoUrl || "");
          setTimezone(f?.timezone || "Asia/Dubai");
          setAddress(f?.address || "");
          setPhone(f?.phone || "");
          setEmail(f?.email || "");
          setLicenseNumber(f?.licenseNumber || "");
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };
    run();
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
    if (!firmId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/firms/${firmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, logoUrl, timezone, address, phone, email, licenseNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        setFirm(data.firm || { ...firm, name, logoUrl, timezone, address, phone, email, licenseNumber });
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // Reset form to current firm data
    if (firm) {
      setName(firm.name || "");
      setLogoUrl(firm.logoUrl || "");
      setTimezone(firm.timezone || "Asia/Dubai");
      setAddress(firm.address || "");
      setPhone(firm.phone || "");
      setEmail(firm.email || "");
      setLicenseNumber(firm.licenseNumber || "");
    }
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!firmId) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {locale === "ar" ? "لا يوجد مكتب" : "No Firm"}
          </h2>
          <p className="text-gray-500 mb-6">
            {locale === "ar" ? "أنت غير مرتبط بأي مكتب" : "You are not associated with any firm"}
          </p>
          <Button onClick={() => router.push(`/${locale}/onboarding/start`)}>
            {locale === "ar" ? "إنشاء أو الانضمام لمكتب" : "Create or Join a Firm"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h1>
          </div>
        </motion.div>

        {/* Firm Logo & Name Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] overflow-hidden"
        >
          {/* Logo Banner */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600">
            {isEditing && (
              <label className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <Camera size={16} className="text-gray-700" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
            )}
          </div>

          {/* Logo & Name */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
              {/* Logo */}
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-[0_0_20px_0_rgba(0,0,0,0.1)] bg-gray-200 overflow-hidden flex items-center justify-center">
                {logoUrl || firm?.logoUrl ? (
                  <img
                    src={isEditing ? logoUrl : firm?.logoUrl}
                    alt={firm?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 size={32} className="text-gray-400" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 md:mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {firm?.name}
                </h2>
                {firm?.tag && (
                  <p className="text-blue-600 font-medium">@{firm.tag}</p>
                )}
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Pencil size={16} />
                  {t.edit}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] p-6 md:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-blue-500" />
              {t.basicInfo}
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.firmName}</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.firmName}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.timezone}</label>
                  <Select
                    value={timezone}
                    onChange={(v) => setTimezone(v)}
                    options={TIMEZONES}
                  />
                </div>
              </div>
            ) : (
              <div>
                <InfoRow icon={<Building2 size={18} />} label={t.firmName} value={firm?.name} />
                <InfoRow icon={<Clock size={18} />} label={t.timezone} value={firm?.timezone} />
              </div>
            )}
          </motion.div>

          {/* Contact Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] p-6 md:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-green-500" />
              {t.contactInfo}
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.phone}</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phone}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.email}</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email}
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.address}</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t.address}
                  />
                </div>
              </div>
            ) : (
              <div>
                <InfoRow icon={<Phone size={18} />} label={t.phone} value={firm?.phone} />
                <InfoRow icon={<Mail size={18} />} label={t.email} value={firm?.email} />
                <InfoRow icon={<MapPin size={18} />} label={t.address} value={firm?.address} />
              </div>
            )}
          </motion.div>

          {/* Legal Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)] p-6 md:p-8 lg:col-span-2"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-amber-500" />
              {t.legalInfo}
            </h3>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">{t.license}</label>
                  <Input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={t.license}
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow icon={<FileText size={18} />} label={t.license} value={firm?.licenseNumber} />
                <InfoRow icon={<Globe size={18} />} label={t.joinCode} value={firm?.joinCode} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-3"
          >
            <Button variant="ghost" onClick={handleCancel}>
              <X size={16} className="mr-2" />
              {t.cancel}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save size={16} className="mr-2" />
              {t.save}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
