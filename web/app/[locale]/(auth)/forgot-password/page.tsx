/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/ui/FormGroup";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AlertContainer from "@/components/ui/AlertContainer";
import { useAlert } from "@/hooks/useAlert";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  const { t, dir } = useTranslation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { alerts, success, error, closeAlert } = useAlert();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      success(t.auth.forgotPassword.success);
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-8" dir={dir}>
      <AlertContainer alerts={alerts} onClose={closeAlert} />
      
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <Link href={`/${lang}`}>
        <img src="/logo.png" alt="logo" className="w-[100px] hover:scale-110 transition-all" />
      </Link>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-[22px] font-bold">{t.auth.forgotPassword.title}</h1>
          <p className="text-[14px] max-w-[270px] mx-auto text-gray-500">
            {t.auth.forgotPassword.subtitle}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormGroup>
            <Input
              placeholder={t.auth.forgotPassword.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </FormGroup>

          <Button full loading={loading} type="submit">
            {loading ? t.auth.forgotPassword.submitting : t.auth.forgotPassword.submit}
          </Button>
        </form>

        <Link
          href={`/${lang}/login`}
          className="block text-center text-[#2E71E5] hover:underline text-[14px]"
        >
          {t.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    </div>
  );
}
