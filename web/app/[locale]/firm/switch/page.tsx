"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ModalButton from "@/components/ui/ModalButton";

export default function FirmSwitchPage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  type Membership = { id: string; firmId: string; name?: string; tag?: string };
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/firms/memberships");
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships || []);
      }
      setLoading(false);
    };
    run();
  }, []);

  async function switchTo(firmId: string) {
    await fetch("/api/firms/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmId }),
    });
    location.reload();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-[24px] font-bold text-gray-900">{locale === "ar" ? "تبديل الشركة" : "Switch Firm"}</h1>
      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
        {loading ? (
          <div className="py-10 text-center">...</div>
        ) : memberships.length === 0 ? (
          <p className="text-gray-600 text-[14px]">{locale === "ar" ? "ليس لديك عضويات" : "No memberships"}</p>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <div key={m.id} className="flex items-center justify-between border rounded-[12px] p-4">
                <div>
                  <div className="font-semibold text-gray-900">{m.name || m.firmId}</div>
                  <div className="text-sm text-gray-700">{m.tag ? `@${m.tag}` : ""}</div>
                </div>
                <ModalButton onClick={() => switchTo(m.firmId)}>{locale === "ar" ? "اختيار" : "Select"}</ModalButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
