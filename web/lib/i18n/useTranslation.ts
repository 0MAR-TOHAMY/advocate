"use client";

import { usePathname } from "next/navigation";
import { translations, Language } from "./translations";

export function useTranslation() {
  const pathname = usePathname();
  
  // Detect language from pathname (e.g., /ar/login or /en/login)
  const lang = pathname?.startsWith("/en") ? "en" : "ar";
  
  const t = translations[lang];
  
  const changeLanguage = (newLang: Language) => {
    const currentPath = pathname || "/";
    const pathWithoutLang = currentPath.replace(/^\/(ar|en)/, "");
    window.location.href = `/${newLang}${pathWithoutLang}`;
  };
  
  return {
    t,
    lang,
    changeLanguage,
    dir: lang === "ar" ? "rtl" : "ltr",
  };
}
