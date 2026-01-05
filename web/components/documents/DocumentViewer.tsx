"use client";

import React from "react";
import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
  mimeType?: string | null;
};

export default function DocumentViewer({ open, onClose, url, title, mimeType }: Props) {
  // Determine the effective URL for viewing
  let effectiveUrl = url;
  let isKey = false;

  if (url) {
    if (url.startsWith("http")) {
      // External URL
      effectiveUrl = url;
    } else if (url.startsWith("/api/documents/download")) {
      // Internal download proxy - convert to preview proxy if key exists
      try {
        const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const key = urlObj.searchParams.get("key");
        if (key) {
          effectiveUrl = `/api/documents/preview?key=${encodeURIComponent(key)}`;
          isKey = true;
        }
      } catch (e) {
        effectiveUrl = url;
      }
    } else if (url.startsWith("/api/")) {
      // Other internal API URL, use as is
      effectiveUrl = url;
    } else if (url.startsWith("/")) {
      // Other local path, use as is
      effectiveUrl = url;
    } else {
      // Raw S3 key
      effectiveUrl = `/api/documents/preview?key=${encodeURIComponent(url)}`;
      isKey = true;
    }
  }

  const isImage = !!url && (
    (mimeType && mimeType.startsWith("image/")) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url)
  );
  const isPdf = !!url && (
    (mimeType && /pdf/i.test(mimeType)) || /\.pdf$/i.test(url)
  );
  const isText = !!url && (
    (mimeType && mimeType.startsWith("text/")) || /\.(txt|csv|tsv)$/i.test(url)
  );
  const isOffice = !!url && (/\.(docx|xlsx|pptx)$/i.test(url));
  const isLegacyOffice = !!url && (/\.(doc|xls|ppt)$/i.test(url));

  // Office viewer needs a public URL. This will only work if effectiveUrl is public.
  const officeViewerUrl = effectiveUrl && !isKey ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(effectiveUrl)}` : null;

  return (
    <Modal isOpen={open} onClose={onClose} title={title || "Document"}>
      {effectiveUrl ? (
        <div className="w-full h-[70vh]">
          {isImage ? (
            <img src={effectiveUrl} alt={title || "image"} className="w-full h-full object-contain rounded-[10px] border border-gray-200" />
          ) : isPdf ? (
            <iframe src={effectiveUrl} className="w-full h-full rounded-[10px] border border-gray-200" />
          ) : (isOffice || isLegacyOffice) && officeViewerUrl ? (
            <iframe src={officeViewerUrl} className="w-full h-full rounded-[10px] border border-gray-200" />
          ) : (
            <iframe src={effectiveUrl} className="w-full h-full rounded-[10px] border border-gray-200" />
          )}
        </div>
      ) : (
        <div className="text-gray-600">No document</div>
      )}
    </Modal>
  );
}
