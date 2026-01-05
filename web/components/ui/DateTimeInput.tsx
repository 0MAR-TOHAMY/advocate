"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locale?: string;
  className?: string;
};

export default function DateTimeInput({ placeholder, value, onChange, disabled, locale, className }: Props) {
  const isRTL = locale === "ar";
  const [datePart, setDatePart] = useState<string>("");
  const [timePart, setTimePart] = useState<string>("");
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const lastExternalValue = useRef<string | undefined>(undefined);
  const lastEmittedValue = useRef<string>("");
  const openDate = () => {
    const el = dateRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker(); else { el.focus(); el.click(); }
  };
  const openTime = () => {
    const el = timeRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker(); else { el.focus(); el.click(); }
  };

  useEffect(() => {
    if (value === lastExternalValue.current) return;
    lastExternalValue.current = value;
    if (!value) {
      queueMicrotask(() => {
        setDatePart("");
        setTimePart("");
      });
      return;
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      queueMicrotask(() => {
        setDatePart(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      });
      queueMicrotask(() => {
        setTimePart(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      });
    }
  }, [value]);

  const displayValue = useMemo(() => {
    return datePart && timePart ? `${datePart}T${timePart}` : datePart || "";
  }, [datePart, timePart]);

  useEffect(() => {
    if (displayValue === (value || "")) return;
    if (displayValue === lastEmittedValue.current) return;
    lastEmittedValue.current = displayValue;
    onChange(displayValue);
  }, [displayValue, onChange, value]);

  const dateLabel = isRTL ? "التاريخ" : "Date";
  const timeLabel = isRTL ? "الوقت" : "Time";

  const formattedDate = useMemo(() => {
    if (!datePart) return "";
    try {
      const d = new Date(datePart);
      return d.toLocaleDateString(locale || "en", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return datePart;
    }
  }, [datePart, locale]);

  const formattedTime = useMemo(() => {
    if (!timePart) return "";
    try {
      const [h, m] = timePart.split(":");
      const t = new Date();
      t.setHours(parseInt(h || "0", 10), parseInt(m || "0", 10), 0, 0);
      return t.toLocaleTimeString(locale || "en", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return timePart;
    }
  }, [timePart, locale]);

  return (
    <div className={`w-full ${className || ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-[15px] bg-gray-50 min-h-[75px] px-[14px] text-[14px]">
          <div className="w-full text-center py-1 border-b border-gray-200">
            <span className="text-[12px] text-gray-700">{placeholder || (isRTL ? "اختر التاريخ والوقت" : "Select date and time")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <input ref={dateRef} type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} disabled={disabled} className="absolute opacity-0 w-1 h-1" />
            <input ref={timeRef} type="time" value={timePart} onChange={(e) => setTimePart(e.target.value)} disabled={disabled} className="absolute opacity-0 w-1 h-1" />
            <button type="button" onClick={openDate} disabled={disabled} className="flex items-center gap-2 hover:text-gray-900">
              <Calendar className="h-3 w-3 text-gray-600" />
              <span className="text-xs text-gray-500">{dateLabel}:</span>
              <span className={`text-xs ${datePart ? "text-gray-700" : "text-gray-400"}`}>{datePart ? formattedDate : (isRTL ? "اختر التاريخ" : "Select date")}</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <button type="button" onClick={openTime} disabled={disabled} className="flex items-center gap-2 hover:text-gray-900">
              <Clock className="h-3 w-3 text-gray-600" />
              <span className="text-xs text-gray-500">{timeLabel}:</span>
              <span className={`text-xs ${timePart ? "text-gray-700" : "text-gray-400"}`}>{timePart ? formattedTime : (isRTL ? "اختر الوقت" : "Select time")}</span>
            </button>
            <button
              type="button"
              onClick={() => { setDatePart(""); setTimePart(""); }}
              disabled={disabled}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50"
              aria-label={isRTL ? "مسح" : "Clear"}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
