/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/plans", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data.plans || []);
    }
    load();
  }, []);

  async function checkout(planId: string) {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.assign(data.url);
    } else {
      setMsg(data.message || "حدث خطأ");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">الخطط</h1>
      {msg && <div className="mb-2 text-sm">{msg}</div>}
      <div className="grid grid-cols-1 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm">{p.price} {p.currency}</div>
            </div>
            <Button loading={loading} onClick={() => checkout(p.id)}>اشتراك</Button>
          </div>
        ))}
      </div>
    </div>
  );
}