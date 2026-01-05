"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import ModalButton from "@/components/ui/ModalButton";

export default function FirmJoinSettingsPage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  const [firmId, setFirmId] = useState<string>("");
  const [tag, setTag] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const fId = meData?.user?.firmId || "";
      setFirmId(fId);
      if (!fId) return;
      const res = await fetch(`/api/firms/${fId}`);
      if (res.ok) {
        const data = await res.json();
        const f = data.firm;
        setTag(f?.tag || "");
        setJoinCode(f?.joinCode || "");
      }
    };
    run();
  }, []);

  async function saveTag() {
    if (!firmId) return;
    setSavingTag(true);
    try {
      const res = await fetch(`/api/firms/${firmId}/tag`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag }) });
      if (res.ok) {
        const data = await res.json();
        setTag(data.tag || tag);
      }
    } finally {
      setSavingTag(false);
    }
  }

  async function regen() {
    if (!firmId) return;
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/firms/${firmId}/join-code`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setJoinCode(data.joinCode || "");
      }
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-[24px] font-bold text-gray-900">{locale === "ar" ? "إعدادات الانضمام" : "Join Settings"}</h1>
      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={locale === "ar" ? "وسم الشركة" : "Firm tag"} />
          <ModalButton onClick={saveTag} loading={savingTag}>{locale === "ar" ? "حفظ الوسم" : "Save Tag"}</ModalButton>
        </div>
        <div className="grid gap-3 md:grid-cols-2 items-center">
          <Input value={joinCode} readOnly placeholder={locale === "ar" ? "رمز الانضمام" : "Join Code"} />
          <ModalButton onClick={regen} loading={regenLoading}>{locale === "ar" ? "تجديد الرمز" : "Regenerate Code"}</ModalButton>
        </div>
      </div>
    </div>
  );
}
