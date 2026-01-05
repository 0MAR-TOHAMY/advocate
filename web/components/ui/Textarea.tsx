"use client";
import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = "", error, ...props }, ref) => {
        const base = "w-full rounded-[15px] bg-gray-100 min-h-[100px] px-[30px] py-3 text-[14px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E71E5] transition-all";
        const errorClass = error ? "border-2 border-red-500" : "";

        return (
            <div className="w-full">
                <textarea
                    ref={ref}
                    className={`${base} ${errorClass} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="text-red-500 text-xs mt-1 px-2">{error}</p>
                )}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
