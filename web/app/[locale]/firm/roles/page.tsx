"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import ModalButton from "@/components/ui/ModalButton";

export default function FirmRolesPage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  const router = useRouter();
  type Role = { id: string; name: string; description?: string };
  const [roles, setRoles] = useState<Role[]>([]);
  const [firmId, setFirmId] = useState<string>("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        const fId = meData?.user?.firmId || "";
        setFirmId(fId);
        if (!fId) return;
        const res = await fetch(`/api/firms/${fId}/roles`);
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles || []);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  async function createRole() {
    if (!firmId || !name.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/firms/${firmId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      setName("");
      setDesc("");
      const res = await fetch(`/api/firms/${firmId}/roles`);
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(id: string) {
    if (!firmId) return;
    await fetch(`/api/firms/${firmId}/roles/${id}`, { method: "DELETE" });
    const res = await fetch(`/api/firms/${firmId}/roles`);
    if (res.ok) {
      const data = await res.json();
      setRoles(data.roles || []);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">{locale === "ar" ? "أدوار الشركة" : "Firm Roles"}</h1>
          <p className="text-gray-500 text-[14px]">{locale === "ar" ? "إدارة الأدوار والصلاحيات" : "Manage roles and permissions"}</p>
        </div>
      </div>

      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === "ar" ? "اسم الدور" : "Role name"} />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={locale === "ar" ? "الوصف" : "Description"} />
        </div>
        <div className="flex justify-end">
          <ModalButton onClick={createRole} loading={saving}>{locale === "ar" ? "إنشاء" : "Create"}</ModalButton>
        </div>
      </div>

      <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
        {loading ? (
          <div className="py-10 text-center">...</div>
        ) : roles.length === 0 ? (
          <p className="text-gray-600 text-[14px]">{locale === "ar" ? "لا توجد أدوار" : "No roles"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-start p-4 font-semibold text-gray-700 text-sm">{locale === "ar" ? "الاسم" : "Name"}</th>
                  <th className="text-start p-4 font-semibold text-gray-700 text-sm">{locale === "ar" ? "الوصف" : "Description"}</th>
                  <th className="text-end p-4 font-semibold text-gray-700 text-sm">{locale === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-900 font-medium">{r.name}</td>
                    <td className="p-4 text-gray-700">{r.description || "-"}</td>
                    <td className="p-4 text-end">
                      <ModalButton variant="outline" className="mr-2" onClick={() => router.push(`/${locale}/firm/roles/edit?id=${r.id}`)}>{locale === "ar" ? "تعديل" : "Edit"}</ModalButton>
                      <ModalButton variant="outline" onClick={() => deleteRole(r.id)}>{locale === "ar" ? "حذف" : "Delete"}</ModalButton>
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
