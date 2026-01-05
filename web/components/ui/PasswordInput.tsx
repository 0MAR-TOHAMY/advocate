"use client";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { usePathname } from "next/navigation";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const pathname = usePathname();
    const currentLang = pathname?.split("/")[1] || "ar";
    const isRTL = currentLang === "ar";
    
    const base = "w-full rounded-[15px] bg-gray-100 min-h-[55px] px-[30px] text-[14px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E71E5] transition-all";
    const errorClass = error ? "border-2 border-red-500" : "";
    const eyePosition = isRTL ? "left-[20px]" : "right-[20px]";
    
    return (
      <div className="w-full">
        <div className="relative">
          <input 
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`${base} ${errorClass} ${className}`}
            dir={isRTL ? "rtl" : "ltr"}
            {...props} 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute ${eyePosition} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-xs mt-1 px-2">{error}</p>
        )}
      </div>
    );
  }
);

 PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
