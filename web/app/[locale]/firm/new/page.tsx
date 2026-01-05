"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import ModalButton from "@/components/ui/ModalButton";
import ImageUpload from "@/components/ui/ImageUpload";
import Select from "@/components/ui/Select";
import FileUpload from "@/components/ui/FileUpload";
import DateTimeInput from "@/components/ui/DateTimeInput";
import ColorPicker from "@/components/ui/ColorPicker";

export default function NewFirmPage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  const router = useRouter();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [timezone, setTimezone] = useState("Asia/Dubai");
  const [currency, setCurrency] = useState("AED");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseDocUrl, setLicenseDocUrl] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  async function createFirm() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/firms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl, primaryColor, secondaryColor, timezone, currency, address, phone, email, licenseNumber, tag, licenseDocumentUrl: licenseDocUrl, licenseExpiryDate: licenseExpiry }),
      });
      if (res.ok) {
        router.push(`/${locale}/firm/settings`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-[920px] mx-auto p-6">
        <h1 className="text-[24px] font-bold text-gray-900 text-center mb-4">{locale === "ar" ? "إنشاء شركة جديدة" : "Create New Firm"}</h1>
        <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.03)] rounded-[20px] p-6 space-y-4 border border-gray-100">
          <div className="grid gap-6 md:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === "ar" ? "اسم الشركة *" : "Firm name *"} />

          <div>
            <ImageUpload
              label={locale === "ar" ? "شعار الشركة" : "Firm Logo"}
              type="cover"
              currentImage={logoUrl || null}
              onUpload={async (file) => {
                const form = new FormData();
                form.append("file", file);
                form.append("folder", "advocate/covers");
                form.append("resourceType", "image");
                form.append("tags", "firm_logo");
                const res = await fetch("/api/uploads/cloudinary", { method: "POST", body: form });
                if (res.ok) {
                  const data = await res.json();
                  setLogoUrl(data.secureUrl || data.url || "");
                }
              }}
            />
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
            <ColorPicker value={primaryColor} onChange={setPrimaryColor} label={locale === "ar" ? "اللون الأساسي" : "Primary color"} />
            <ColorPicker value={secondaryColor} onChange={setSecondaryColor} label={locale === "ar" ? "اللون الثانوي" : "Secondary color"} />
          </div>

          <Select
            value={timezone}
            onChange={(v) => setTimezone(v)}
            options={[
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
              { value: "Africa/Tripoli", label: "Africa/Tripoli" },
              { value: "Asia/Damascus", label: "Asia/Damascus" },
              { value: "Asia/Beirut", label: "Asia/Beirut" },
              { value: "Africa/Khartoum", label: "Africa/Khartoum" },
              { value: "Asia/Aden", label: "Asia/Aden" },
              { value: "Asia/Jerusalem", label: "Asia/Jerusalem" },
              { value: "Africa/Nouakchott", label: "Africa/Nouakchott" },
              { value: "UTC", label: "UTC" },
              { value: "Europe/London", label: "Europe/London" },
              { value: "Europe/Paris", label: "Europe/Paris" },
              { value: "America/New_York", label: "America/New_York" },
            ]}
          />
          <Select
            value={currency}
            onChange={(v) => setCurrency(v)}
            options={[
              { value: "AED", label: "AED" },
              { value: "SAR", label: "SAR" },
              { value: "EGP", label: "EGP" },
              { value: "QAR", label: "QAR" },
              { value: "KWD", label: "KWD" },
              { value: "OMR", label: "OMR" },
              { value: "BHD", label: "BHD" },
              { value: "JOD", label: "JOD" },
              { value: "IQD", label: "IQD" },
              { value: "DZD", label: "DZD" },
              { value: "MAD", label: "MAD" },
              { value: "TND", label: "TND" },
              { value: "LYD", label: "LYD" },
              { value: "SYP", label: "SYP" },
              { value: "LBP", label: "LBP" },
              { value: "SDG", label: "SDG" },
              { value: "YER", label: "YER" },
              { value: "ILS", label: "ILS" },
              { value: "MRU", label: "MRU" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={locale === "ar" ? "العنوان" : "Address"} />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={locale === "ar" ? "الهاتف" : "Phone"} />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder={locale === "ar" ? "رقم الترخيص" : "License Number"} />
          <FileUpload file={licenseFile} onChange={async (file) => { setLicenseFile(file); if (file) { const form = new FormData(); form.append("file", file); form.append("folder", "advocate/documents"); form.append("resourceType", "image"); form.append("tags", "firm_license"); const res = await fetch("/api/uploads/cloudinary", { method: "POST", body: form }); if (res.ok) { const data = await res.json(); setLicenseDocUrl(data.secureUrl || data.url || ""); } } else { setLicenseDocUrl(""); } }} label={locale === "ar" ? "مستند الترخيص" : "License Document"} />
          <DateTimeInput value={licenseExpiry} onChange={setLicenseExpiry} placeholder={locale === "ar" ? "تاريخ انتهاء الترخيص" : "License Expiry Date"} locale={locale} />
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={locale === "ar" ? "وسم الشركة" : "Firm Tag"} />
          <div className="flex justify-end">
            <ModalButton onClick={createFirm} loading={saving}>{locale === "ar" ? "إنشاء" : "Create"}</ModalButton>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
