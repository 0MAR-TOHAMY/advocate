/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import Button from "./Button";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  currentImage?: string | null;
  onRemove?: () => Promise<void>;
  type?: "avatar" | "cover";
  label?: string;
}

export default function ImageUpload({
  onUpload,
  currentImage,
  onRemove,
  type = "avatar",
  label,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error("Upload error:", error);
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  }, [onUpload, currentImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemove = async () => {
    if (!onRemove) return;
    setUploading(true);
    try {
      await onRemove();
      setPreview(null);
    } catch (error) {
      console.error("Remove error:", error);
    } finally {
      setUploading(false);
    }
  };

  const isAvatar = type === "avatar";
  const containerClass = isAvatar
    ? "w-32 h-32 rounded-full"
    : "w-full h-48 rounded-lg";

  return (
    <div className="space-y-4">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="relative">
        {preview ? (
          <div className={`relative ${containerClass} overflow-hidden border-2 border-gray-200`}>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {!uploading && onRemove && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`${containerClass} border-2 border-dashed border-gray-300 hover:border-[#4F46E5] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-gray-50 ${isDragActive ? "border-[#4F46E5] bg-blue-50" : ""
              }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500 text-center px-4">
                  {isDragActive ? "أفلت الصورة هنا" : "اسحب صورة أو انقر للاختيار"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {!preview && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>الحد الأقصى: 5 ميجابايت</p>
          <p>الصيغ المدعومة: PNG, JPG, JPEG, GIF, WEBP</p>
        </div>
      )}
    </div>
  );
}
