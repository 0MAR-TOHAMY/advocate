"use client";

import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

type AlertType = "success" | "error" | "info" | "warning";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const COLORS = {
  success: { text: "text-emerald-600", bg: "bg-emerald-50" },
  error: { text: "text-red-600", bg: "bg-red-50" },
  warning: { text: "text-amber-600", bg: "bg-amber-50" },
  info: { text: "text-blue-600", bg: "bg-blue-50" },
} as const;

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  message: string;
  title?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function AlertModal({
  isOpen,
  type,
  message,
  title,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
}: AlertModalProps) {
  const t = useTranslations("common");
  if (!isOpen) return null;

  const Icon = ICONS[type];
  const colors = COLORS[type];

  return (
    <Modal className="max-w-[350px]!" isOpen={isOpen} onClose={onClose}>
      <div
        className={`relative bg-white rounded-[25px] shadow-[0_0_20px_0_rgba(0,0,0,0.01)] p-8 flex flex-col items-center justify-center gap-4 ${colors.bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon className={`h-10 w-10 ${colors.text}`} />

        {title && (
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            {title}
          </h3>
        )}

        <p className="text-[14px] font-medium text-gray-900 text-center leading-relaxed">{message}</p>

        <div className="flex gap-3 w-full justify-center mt-2">
          {onConfirm ? (
            <>
              <button
                className="flex-1 px-4 py-2.5 rounded-[10px] bg-white border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm"
                onClick={onClose}
              >
                {cancelText || t("cancel")}
              </button>
              <button
                className={`flex-1 px-4 py-2.5 rounded-[10px] text-white text-[13px] font-medium transition-colors shadow-sm ${type === "error" || type === "warning"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-900 hover:bg-gray-800"
                  }`}
                onClick={onConfirm}
              >
                {confirmText || t("confirm")}
              </button>
            </>
          ) : (
            <button
              className="px-6 py-2.5 rounded-[10px] bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors shadow-sm min-w-[100px]"
              onClick={onClose}
            >
              {t("ok")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
