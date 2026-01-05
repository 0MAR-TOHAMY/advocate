"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";

type Option = { value: string; label: string };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function Select({ value, onChange, options, placeholder, className, disabled }: SelectProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center justify-between w-full rounded-[15px] min-h-[55px] px-8 bg-white border border-gray-100 text-gray-600 text-[14px] hover:bg-gray-50 focus:border-gray-300 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="truncate text-left">
          {selected ? selected.label : (placeholder || "Select")}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 ${isRTL ? "mr-1" : "ml-1"}`} />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-full bg-white rounded-[10px] border border-gray-200 shadow-[0_35px_35px_rgba(0,0,0,0.01)]`}
        >
          <ul className="max-h-56 overflow-auto py-1">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[14px] ${opt.value === value ? "bg-blue-50 text-blue-700" : "text-gray-800 hover:bg-gray-50"
                    }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}