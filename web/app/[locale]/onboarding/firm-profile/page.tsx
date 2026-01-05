"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Phone, Mail, MapPin, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";

interface FirmData {
    name: string;
    nameAr: string;
    email: string;
    phone: string;
    address: string;
}

export default function FirmProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = (params?.locale as string) || "ar";
    const isRTL = locale === "ar";
    const t = useTranslations("onboarding");
    const draftId = searchParams.get("draftId");
    const firmIdFromUrl = searchParams.get("firmId");
    const { authenticatedFetch } = useAuth();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [firmData, setFirmData] = useState<FirmData>({
        name: "",
        nameAr: "",
        email: "",
        phone: "",
        address: "",
    });

    const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

    useEffect(() => {
        // Load draft data if exists
        if (draftId) {
            Promise.resolve().then(() => setLoading(true));
            authenticatedFetch(`/api/onboarding/draft/${draftId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.draft) {
                        setFirmData({
                            name: data.draft.name || "",
                            nameAr: data.draft.nameAr || "",
                            email: data.draft.email || "",
                            phone: data.draft.phone || "",
                            address: data.draft.address || "",
                        });
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        } else if (firmIdFromUrl) {
            // Load existing firm data
            Promise.resolve().then(() => setLoading(true));
            authenticatedFetch(`/api/firms/${firmIdFromUrl}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.firm) {
                        setFirmData({
                            name: data.firm.name || "",
                            nameAr: data.firm.nameAr || "",
                            email: data.firm.email || "",
                            phone: data.firm.phone || "",
                            address: data.firm.address || "",
                        });
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [draftId, firmIdFromUrl, authenticatedFetch]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!draftId && !firmIdFromUrl) {
            setError(t("noIdProvided"));
            return;
        }

        setSaving(true);
        setError("");

        try {
            let res;
            if (draftId) {
                // Scenario A: Free trial (Draft -> Create Firm)
                res = await authenticatedFetch(`/api/onboarding/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        draftId,
                        ...firmData,
                    }),
                });
            } else {
                // Scenario B: Paid (Firm exists -> Update Firm)
                res = await authenticatedFetch(`/api/firms/${firmIdFromUrl}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...firmData,
                    }),
                });
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || t("errorSaving"));
                setSaving(false);
                return;
            }

            // Redirect to dashboard
            router.push(`/${locale}/dashboard`);
        } catch (error) {
            console.error("Submission error:", error);
            setError(t("errorOccurred"));
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="h-screen bg-white relative overflow-hidden font-sans flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
            {/* Background: Subtle Lights */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-50/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl mx-auto px-6 h-full flex flex-col py-8 overflow-y-auto no-scrollbar">
                {/* Back button */}
                <div className="mb-6 shrink-0">
                    <button
                        onClick={() => router.push(`/${locale}/onboarding/plan`)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs"
                    >
                        <ArrowIcon className="w-4 h-4" />
                        <span>{t("back")}</span>
                    </button>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 shrink-0"
                >
                    <div className="w-12 h-12 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">
                        {t("firmDetails")}
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t("firmDetailsSubtitle")}</p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Firm Name (English) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {t("firmName")} (EN)
                            </label>
                            <input
                                type="text"
                                value={firmData.name}
                                onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold"
                                placeholder="Law Firm Name"
                                required
                            />
                        </div>

                        {/* Firm Name (Arabic) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {t("firmName")} (AR)
                            </label>
                            <input
                                type="text"
                                value={firmData.nameAr}
                                onChange={(e) => setFirmData({ ...firmData, nameAr: e.target.value })}
                                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold"
                                placeholder="اسم المكتب"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> {t("email")}
                        </label>
                        <input
                            type="email"
                            value={firmData.email}
                            onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold"
                            placeholder="contact@lawfirm.com"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {t("phone")}
                        </label>
                        <input
                            type="tel"
                            value={firmData.phone}
                            onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold"
                            placeholder="+971 4 123 4567"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {t("address")}
                        </label>
                        <textarea
                            value={firmData.address}
                            onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold resize-none"
                            placeholder={t("addressPlaceholder")}
                            rows={2}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>
                    )}

                    {/* Submit button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            loading={saving}
                            disabled={saving || !firmData.name || !firmData.email}
                            className="w-full h-12 text-sm font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white shadow-md hover:bg-black active:scale-[0.98] transition-all"
                        >
                            <Check className="w-4 h-4 me-2" />
                            {t("completeFirmSetup")}
                        </Button>
                    </div>
                </motion.form>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
