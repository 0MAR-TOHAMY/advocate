"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";

export default function SelectModePage() {
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">اختر الطريقة</h1>
      <div className="flex gap-4">
        <Link href={`/${lang}/plans`}>
          <Button>إنشاء شركة</Button>
        </Link>
        <Link href={`/${lang}/firms/join`}>
          <Button>الانضمام إلى شركة</Button>
        </Link>
      </div>
    </div>
  );
}