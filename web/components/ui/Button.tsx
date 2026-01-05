"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  full?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", full, loading, className = "", children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center min-h-[55px] justify-center rounded-[15px] px-[30px] text-[16px] font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    const primary = "bg-brand-primary text-white hover:opacity-90 transition-opacity";
    const outline = "border border-gray-300 text-gray-700 hover:bg-gray-50";
    const ghost = "text-gray-700 hover:bg-gray-100 !shadow-none";
    const width = full ? "w-full" : "";

    const variantClass = variant === "primary" ? primary : variant === "outline" ? outline : ghost;
    const styles = `${base} ${variantClass} ${width} ${className}`;

    return (
      <button
        ref={ref}
        className={styles}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
