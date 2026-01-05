"use client";

import React from "react";

type Props = {
    type?: "button" | "submit";
    variant?: "solid" | "outline" | "ghost";
    color?: "gray" | "blue" | "red" | "green" | "neutral" | "brand";
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    onClick?: () => void;
    children: React.ReactNode;
};

function colorClasses(color: Props["color"], variant: Props["variant"]) {
    const c = color || "gray";
    if (variant === "outline") {
        return c === "red"
            ? "border border-red-200 text-red-700 hover:bg-red-50"
            : c === "blue"
                ? "border border-blue-200 text-blue-700 hover:bg-blue-50"
                : c === "green"
                    ? "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    : c === "brand"
                        ? "border border-brand-primary text-brand-primary hover:bg-brand-primary/5"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50";
    }
    if (variant === "ghost") {
        return "text-gray-700 hover:bg-gray-50";
    }
    return c === "red"
        ? "bg-red-600 text-white hover:bg-red-700"
        : c === "blue"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : c === "green"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : c === "brand"
                    ? "bg-brand-primary text-white hover:opacity-90"
                    : "bg-gray-900 text-white hover:bg-black";
}

export default function ModalButton({ type = "button", variant = "solid", color = "gray", disabled, loading, className, onClick, children }: Props) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`inline-flex items-center justify-center min-h-[50px] px-[40px] rounded-[15px] text-[12px] transition-colors ${colorClasses(color, variant)} ${disabled || loading ? "opacity-60 cursor-not-allowed" : ""} ${className || ""}`}
        >
            {children}
        </button>
    );
}

