/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/ui/FormGroup";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AlertContainer from "@/components/ui/AlertContainer";
import { useAlert } from "@/hooks/useAlert";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  const { t, dir } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { alerts, success, error, closeAlert } = useAlert();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error(t.auth.register.passwordMismatch);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      success(t.auth.register.success);

      setTimeout(() => {
        router.push(`/${lang}/verify-email?email=${encodeURIComponent(email)}`);
      }, 1500);
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
          <h1 className="text-[22px] font-bold">{t.auth.register.title}</h1>
          <p className="text-[14px] max-w-[270px] mx-auto text-gray-500">
            {t.auth.register.subtitle}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormGroup>
            <Input
              placeholder={t.auth.register.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Input
              placeholder={t.auth.register.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </FormGroup>

          <FormGroup>
            <PasswordInput
              placeholder={t.auth.register.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <PasswordInput
              placeholder={t.auth.register.confirmPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormGroup>

          <Button full loading={loading} type="submit">
            {loading ? t.auth.register.submitting : t.auth.register.submit}
          </Button>
        </form>

        <div className="flex flex-col gap-[30px] text-[14px]">
          <Link
            className="bg-gray-100 inline-flex items-center min-h-[55px] justify-center rounded-[15px] px-[30px] text-[14px] font-medium transition-colors shadow-none cursor-pointer gap-[10px] hover:bg-gray-200"
            href="/api/auth/google/url"
          >
            {t.auth.register.googleRegister}
            <img src="/Google.png" alt="Google" className="w-[20px] h-[20px]" />
          </Link>

          <Link href={`/${lang}/login`} className="text-center text-gray-700">
            {t.auth.register.haveAccount}{" "}
            <span className="text-[#2E71E5]">{t.auth.register.login}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
