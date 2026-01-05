"use client";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const currentLang = pathname?.split("/")[1] || "ar";

  const toggleLanguage = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    const newPath = pathname?.replace(`/${currentLang}`, `/${newLang}`) || `/${newLang}`;
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-[15px] hover:bg-gray-200 transition-colors"
      type="button"
    >
      <Globe className="w-4 h-4" />
      <span>{currentLang === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
