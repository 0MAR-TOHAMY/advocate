/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function FirmDashboardPage() {
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  const [firm, setFirm] = useState<any | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) { setMsg("غير مصرح"); return; }
      const me = await meRes.json();
      const firmId = me.user?.firmId || "";
      if (!firmId) { setMsg("اختر شركة نشطة"); return; }
      const res = await fetch(`/api/firms/${firmId}`, { credentials: "include" });
      if (!res.ok) { setMsg("حدث خطأ"); return; }
      const data = await res.json();
      setFirm(data.firm || null);
      setRoles(data.roles || []);
      setMsg("");
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">لوحة الشركة</h1>
      {msg && <div>{msg}</div>}
      {firm && (
        <div className="space-y-2">
          <div>الاسم: {firm.name}</div>
          <div>الحالة: {firm.subscriptionStatus}</div>
          <div>المستخدمون: {firm.currentUsers} / {firm.maxUsers ?? "غير محدود"}</div>
        </div>
      )}
      {roles && roles.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">الأدوار</h2>
          <ul className="list-disc pl-6">
            {roles.map((r: any) => <li key={r.id}>{r.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}