"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function NotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(100, 150, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float-slow" />
        <div
          className="absolute top-20 right-20 w-48 h-48 bg-blue-200/45 rounded-full blur-3xl animate-float-medium"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-56 h-56 bg-blue-200/45 rounded-full blur-3xl animate-float-fast"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-72 h-72 bg-blue-200/45 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 right-32 w-60 h-60 bg-blue-200/45 rounded-full blur-3xl animate-float-medium"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 left-16 w-52 h-52 bg-blue-200/45 rounded-full blur-3xl animate-float-fast"
          style={{ animationDelay: "5s" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 md:px-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-8 md:p-12 text-center max-w-2xl w-full">
          <div className="text-[96px] md:text-[120px] font-extrabold leading-none text-gray-900">404</div>
          <div className="mt-2 text-2xl md:text-3xl font-semibold">
            <span className="glow-text">{t("title")}</span>
          </div>
          <p className="mt-3 text-gray-600 text-sm md:text-base">{t("subtitle")}</p>
          <div className="mt-6">
            <Link href={`/${locale}/dashboard`}>
              <Button className="px-6! py-2! text-[14px]!">{t("goHome")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

