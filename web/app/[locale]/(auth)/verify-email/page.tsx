/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/ui/FormGroup";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AlertContainer from "@/components/ui/AlertContainer";
import { useAlert } from "@/hooks/useAlert";
import { useTranslation } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params.locale as string) || "ar";
  const email = searchParams.get("email") || "";
  const { t, dir } = useTranslation();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { alerts, success, error, closeAlert } = useAlert();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      success(t.auth.verifyEmail.success);

      setTimeout(() => {
        router.push(`/${lang}/login`);
      }, 2000);
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      success("تم إعادة إرسال الرمز بنجاح");
    } catch (err: any) {
      error(err.message);
    } finally {
      setResending(false);
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
          <h1 className="text-[22px] font-bold">{t.auth.verifyEmail.title}</h1>
          <p className="text-[14px] max-w-[270px] mx-auto text-gray-500">
            {t.auth.verifyEmail.subtitle}
          </p>
          {email && (
            <p className="text-[12px] text-gray-400">{email}</p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormGroup>
            <Input
              placeholder={t.auth.verifyEmail.code}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </FormGroup>

          <Button full loading={loading} type="submit">
            {loading ? t.auth.verifyEmail.submitting : t.auth.verifyEmail.submit}
          </Button>
        </form>

        <Button
          variant="ghost"
          full
          loading={resending}
          onClick={handleResend}
          type="button"
        >
          {t.auth.verifyEmail.resend}
        </Button>
      </div>
    </div>
  );
}
