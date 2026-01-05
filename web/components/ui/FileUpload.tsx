"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  locale?: string;
  label?: string;
};

export default function FileUpload({ file, onChange, accept, disabled, className, locale, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleFiles(files?: FileList | null) {
    if (!files || !files[0]) return;
    onChange(files[0]);
  }

  const isRTL = locale === "ar";

  return (
    <div className={className || ""}>
      <input ref={inputRef} type="file" accept={accept} onChange={(e) => handleFiles(e.target.files)} disabled={disabled} className="hidden" />
      {!file ? (
        <div
          onClick={openPicker}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={`flex items-center justify-center w-full rounded-[15px] min-h-[120px] px-4 border-2 border-dashed ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"} text-gray-700 cursor-pointer`}
        >
          <div className={`flex items-center ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3`}>
            <div className={`p-3 rounded-full ${dragOver ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
              <Upload className="h-5 w-5" />
            </div>
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <div className="text-sm font-medium">{label || (isRTL ? "اسحب وافلت الملف هنا أو اضغط للاختيار" : "Drag & drop a file here, or click to select")}</div>
              <div className="text-xs text-gray-500">{isRTL ? "PDF, صور، وملفات أخرى" : "PDF, images, and other files"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full rounded-[15px] min-h-[60px] px-4 border border-gray-200 bg-white">
          <div className={`flex items-center ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3 overflow-hidden`}>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FileText className="h-5 w-5" /></div>
            <div className={`${isRTL ? "text-right" : "text-left"} truncate`}>
              <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
              <div className="text-xs text-gray-500">
                {(() => {
                  const k = 1024; const sizes = ["Bytes","KB","MB","GB"]; const i = Math.min(3, Math.floor(Math.log(file.size || 1) / Math.log(k))); const val = (file.size / Math.pow(k, i)).toFixed(2); return `${val} ${sizes[i]}`;
                })()}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => onChange(null)} disabled={disabled} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
