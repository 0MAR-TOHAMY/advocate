"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ModalButton from "@/components/ui/ModalButton";

export default function FirmRequestsPage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  const [firmId, setFirmId] = useState<string>("");
  type RequestRow = { id: string; userId: string; status: string };
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const fId = meData?.user?.firmId || "";
      setFirmId(fId);
      if (!fId) { setLoading(false); return; }
      const res = await fetch(`/api/firms/${fId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
      setLoading(false);
    };
    run();
  }, []);

  async function approve(id: string) {
    if (!firmId) return;
    await fetch(`/api/firms/${firmId}/requests/${id}/approve`, { method: "POST" });
    const res = await fetch(`/api/firms/${firmId}/requests`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
    }
  }

  async function reject(id: string) {
    if (!firmId) return;
    await fetch(`/api/firms/${firmId}/requests/${id}/reject`, { method: "POST" });
    const res = await fetch(`/api/firms/${firmId}/requests`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-[24px] font-bold text-gray-900">{locale === "ar" ? "طلبات الانضمام" : "Join Requests"}</h1>
      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
        {loading ? (
          <div className="py-10 text-center">...</div>
        ) : requests.length === 0 ? (
          <p className="text-gray-600 text-[14px]">{locale === "ar" ? "لا توجد طلبات" : "No requests"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-start p-4 font-semibold text-gray-700 text-sm">ID</th>
                  <th className="text-start p-4 font-semibold text-gray-700 text-sm">User</th>
                  <th className="text-start p-4 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="text-end p-4 font-semibold text-gray-700 text-sm">{locale === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-900 font-medium">{r.id}</td>
                    <td className="p-4 text-gray-700">{r.userId}</td>
                    <td className="p-4 text-gray-700">{r.status}</td>
                    <td className="p-4 text-end">
                      <ModalButton variant="outline" className="mr-2" onClick={() => approve(r.id)}>{locale === "ar" ? "موافقة" : "Approve"}</ModalButton>
                      <ModalButton variant="outline" onClick={() => reject(r.id)}>{locale === "ar" ? "رفض" : "Reject"}</ModalButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
