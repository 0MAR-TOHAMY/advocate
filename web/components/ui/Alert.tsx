"use client";
import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { usePathname } from "next/navigation";

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
  duration?: number; // Auto-close duration in ms (0 = no auto-close)
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
}

export default function Alert({ 
  type, 
  message, 
  onClose, 
  duration = 5000,
  position = "top-center" 
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const pathname = usePathname();
  const currentLang = pathname?.split("/")[1] || "ar";
  const isRTL = currentLang === "ar";

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-yellow-500",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
    },
  };

  const { icon: Icon, iconColor } = config[type];

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-4 left-4",
  };

  const animationClasses = isExiting
    ? "animate-slide-out-right opacity-0"
    : isVisible
    ? "animate-slide-in-right opacity-100"
    : "opacity-0 translate-x-full";

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 ${animationClasses}`}
      role="alert"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="flex items-start gap-3 bg-white rounded-[15px] shadow-[0_4px_6px_1px_rgba(0,0,0,0.05)] p-4 min-w-[320px] max-w-md border border-gray-100"
      >
        <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
        <p className="text-gray-700 flex-1 text-sm font-medium leading-relaxed">
          {message}
        </p>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close alert"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
