/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Building2, ArrowLeft, ArrowRight, Search, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function JoinFirmPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "ar";
  const isRTL = locale === "ar";
  const [tag, setTag] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");
  const [preview, setPreview] = useState<any | null>(null);

  const t = {
    title: locale === "ar" ? "طلب الانضمام إلى مكتب" : "Join a Law Firm",
    subtitle: locale === "ar"
      ? "أدخل وسم المكتب أو رمز الانضمام للبحث"
      : "Enter the firm tag or join code to search",
    tagPlaceholder: locale === "ar" ? "وسم الشركة (مثال: @legal)" : "Firm tag (e.g. @legal)",
    codePlaceholder: locale === "ar" ? "رمز الانضمام" : "Join Code",
    submit: locale === "ar" ? "إرسال طلب الانضمام" : "Send Join Request",
    back: locale === "ar" ? "رجوع" : "Back",
    firmFound: locale === "ar" ? "تم العثور على المكتب" : "Firm Found",
    noFirm: locale === "ar" ? "لم يتم العثور على مكتب" : "No firm found",
    requestSent: locale === "ar" ? "تم إرسال الطلب بنجاح" : "Request sent successfully",
  };

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!tag && !code) { setPreview(null); return; }
      const q = new URLSearchParams();
      if (tag) q.set('tag', tag);
      if (code) q.set('code', code);
      const res = await fetch(`/api/firms/lookup?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPreview(data.firm);
      } else {
        setPreview(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [tag, code]);

  async function submit() {
    setLoading(true);
    setMsg("");
    setMsgType("");
    const res = await fetch("/api/firms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tag, code }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(data.message || t.requestSent);
      setMsgType("success");
    } else {
      setMsg(data.message || (locale === "ar" ? "حدث خطأ" : "An error occurred"));
      setMsgType("error");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen py-12 px-6">
        {/* Back button */}
        <div className="max-w-lg mx-auto mb-8">
          <button
            onClick={() => router.push(`/${locale}/onboarding/start`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowIcon className="w-5 h-5" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/60 space-y-6">
            {/* Tag & Code inputs */}
            <div className="space-y-4">
              <Input
                placeholder={t.tagPlaceholder}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full"
              />
              <Input
                placeholder={t.codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Firm Preview */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{preview.name}</p>
                    <p className="text-sm text-emerald-600">@{preview.tag}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                </div>
              </motion.div>
            )}

            {!preview && (tag || code) && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <Search className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                {t.noFirm}
              </div>
            )}

            {/* Message */}
            {msg && (
              <div className={`text-center text-sm p-3 rounded-xl ${msgType === "success"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                {msg}
              </div>
            )}

            {/* Submit Button */}
            <Button
              full
              loading={loading}
              onClick={submit}
              disabled={!preview}
              className="py-3"
            >
              {t.submit}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}