/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/ui/FormGroup";
import Checkbox from "@/components/ui/Checkbox";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AlertContainer from "@/components/ui/AlertContainer";
import { useAlert } from "@/hooks/useAlert";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  const { t, dir } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { alerts, success, error, closeAlert } = useAlert();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login(email, password, rememberMe);

      success(t.auth.login.success);

      setTimeout(() => {
        // If user has firmId, go to dashboard, otherwise go to onboarding
        if (userData?.firmId) {
          router.push(`/${lang}/dashboard`);
        } else {
          router.push(`/${lang}/onboarding/start`);
        }
      }, 1000);
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
          <h1 className="text-[22px] font-bold">{t.auth.login.title}</h1>
          <p className="text-[14px] max-w-[260px] mx-auto text-gray-500">
            {t.auth.login.subtitle}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormGroup>
            <Input
              placeholder={t.auth.login.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </FormGroup>

          <FormGroup>
            <PasswordInput
              placeholder={t.auth.login.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <div className="flex items-center justify-between text-sm">
            <Link
              href={`/${lang}/forgot-password`}
              className="text-[#2E71E5] hover:underline"
            >
              {t.auth.login.forgotPassword}
            </Link>
            <label className="inline-flex text-[14px] items-center gap-2 text-gray-700 cursor-pointer">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t.auth.login.rememberMe}</span>
            </label>
          </div>

          <Button full loading={loading} type="submit">
            {loading ? t.auth.login.submitting : t.auth.login.submit}
          </Button>
        </form>

        <div className="flex flex-col gap-[30px] text-[14px]">
          <Link
            className="bg-gray-100 inline-flex items-center min-h-[55px] justify-center rounded-[15px] px-[30px] text-[14px] font-medium transition-colors shadow-none cursor-pointer gap-[10px] hover:bg-gray-200"
            href="/api/auth/google/url"
          >
            {t.auth.login.googleLogin}
            <img src="/Google.png" alt="Google" className="w-[20px] h-[20px]" />
          </Link>

          <Link href={`/${lang}/register`} className="text-center text-gray-700">
            {t.auth.login.noAccount}{" "}
            <span className="text-[#2E71E5]">{t.auth.login.createAccount}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
