"use client";

import React from "react";
import { ChevronDown, Check } from "lucide-react";
import { useParams } from "next/navigation";

type Option = { value: string; label: string };

type MultiSelectProps = {
    values: string[];
    onChange: (values: string[]) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

export default function MultiSelect({ values, onChange, options, placeholder, className, disabled }: MultiSelectProps) {
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

    const toggleOption = (val: string) => {
        if (values.includes(val)) {
            onChange(values.filter(v => v !== val));
        } else {
            onChange([...values, val]);
        }
    };

    const getLabel = () => {
        if (values.length === 0) return placeholder || "Select";
        if (values.length === 1) {
            return options.find(o => o.value === values[0])?.label || placeholder;
        }
        return locale === "ar" ? `${values.length} تم اختيارهم` : `${values.length} Selected`;
    };

    return (
        <div ref={ref} className={`relative ${className || ""}`}>
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`flex items-center justify-between w-full rounded-[15px] min-h-[55px] px-8 bg-white border border-gray-100 text-gray-600 text-[14px] hover:bg-gray-50 focus:border-gray-300 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <span className={`truncate ${isRTL ? "text-right" : "text-left"} flex-1`}>
                    {getLabel()}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 ${isRTL ? "mr-1" : "ml-1"}`} />
            </button>

            {open && (
                <div
                    className={`absolute z-[100] mt-2 w-full bg-white rounded-[10px] border border-gray-200 shadow-[0_35px_35px_rgba(0,0,0,0.05)]`}
                >
                    <ul className="max-h-56 overflow-auto py-1">
                        {options.map((opt) => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onClick={() => toggleOption(opt.value)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-[14px] transition-colors ${values.includes(opt.value) ? "bg-blue-50/50 text-blue-700" : "text-gray-800 hover:bg-gray-50"
                                        }`}
                                >
                                    <span className={isRTL ? "text-right w-full" : "text-left w-full"}>{opt.label}</span>
                                    {values.includes(opt.value) && <Check className="h-4 w-4 flex-shrink-0 ml-2 mr-2" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
