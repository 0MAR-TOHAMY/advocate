"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function CompleteProfilePage() {
  const [firmId, setFirmId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/firms/join/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firmId, roleId, department, phone }),
    });
    const data = await res.json();
    setMsg(data.message || (res.ok ? "تم الحفظ" : "حدث خطأ"));
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold">إكمال الملف</h1>
      <Input placeholder="معرف الشركة" value={firmId} onChange={(e) => setFirmId(e.target.value)} />
      <Input placeholder="معرف الدور" value={roleId} onChange={(e) => setRoleId(e.target.value)} />
      <Input placeholder="القسم" value={department} onChange={(e) => setDepartment(e.target.value)} />
      <Input placeholder="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button loading={loading} onClick={submit}>حفظ</Button>
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}