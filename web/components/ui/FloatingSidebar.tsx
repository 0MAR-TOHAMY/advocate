"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Globe, SquareKanban, KeyRound } from "lucide-react";

interface FloatingSidebarProps {
  onLogout: () => void;
  logoutText: string;
  onChangePassword?: () => void;
  changePasswordText?: string;
}

export default function FloatingSidebar({ onLogout, logoutText, onChangePassword, changePasswordText }: FloatingSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname?.split("/")[1] || "ar";
  const isRTL = currentLang === "ar";

  const toggleLanguage = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    const newPath = pathname?.replace(`/${currentLang}`, `/${newLang}`) || `/${newLang}`;
    router.push(newPath);
  };

  const goToDashboard = () => {
    router.push(`/${currentLang}/dashboard`);
  };

  return (
    <div
      className={`fixed ${isRTL ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 z-50`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trigger Tab */}
      <div
        className={`absolute ${isRTL ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 ${isRTL ? "-right-12" : "-left-12"
          } bg-white shadow-[0_0_20px_0_rgba(0,0,0,0.1)] ${isRTL ? "rounded-l-[15px]" : "rounded-r-[15px]"
          } px-3 py-6 cursor-pointer transition-all duration-300 hover:bg-gray-50 border ${isRTL ? "border-r-0" : "border-l-0"
          } border-gray-200`}
      >
        <div className="flex flex-col gap-1 items-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div
        className={`bg-white shadow-2xl ${isRTL ? "rounded-l-[25px]" : "rounded-r-[25px]"
          } border ${isRTL ? "border-r-0" : "border-l-0"} border-gray-200 transition-all duration-300 ${isHovered ? "translate-x-0 opacity-100" : `${isRTL ? "translate-x-full" : "-translate-x-full"} opacity-0`
          }`}
        style={{ width: "220px" }}
      >
        <div className="p-4 flex flex-col gap-1">
          {/* Dashboard Button */}
          <button
            onClick={goToDashboard}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-[10px] transition-colors text-sm font-medium"
          >
            <SquareKanban className="w-5 h-5 text-blue-500" />
            <span>{currentLang === "ar" ? "لوحة التحكم" : "Dashboard"}</span>
          </button>

          {/* Language Switch Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-[10px] transition-colors text-sm font-medium"
          >
            <Globe className="w-5 h-5 text-blue-500" />
            <span>{currentLang === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* Change Password Button */}
          {onChangePassword && (
            <button
              onClick={onChangePassword}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-[10px] transition-colors text-sm font-medium"
            >
              <KeyRound className="w-5 h-5 text-blue-500" />
              <span>{changePasswordText || (currentLang === "ar" ? "تغيير كلمة المرور" : "Change Password")}</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-[10px] transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>{logoutText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
