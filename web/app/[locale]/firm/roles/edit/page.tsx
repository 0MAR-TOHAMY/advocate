"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import ModalButton from "@/components/ui/ModalButton";
import { PermissionKeys } from "@/lib/rbac/permissions";

export default function EditRolePage() {
  const params = useParams();
  const locale = (params.locale as string) || "ar";
  const sp = useSearchParams();
  const router = useRouter();
  const roleId = sp.get("id") || "";
  const [firmId, setFirmId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const fId = meData?.user?.firmId || "";
      setFirmId(fId);
      if (!fId || !roleId) { setLoading(false); return; }
      const res = await fetch(`/api/firms/${fId}/roles`);
      if (res.ok) {
        const data = await res.json();
        const r = (data.roles || []).find((x: { id: string; name: string; description?: string; permissions?: string[] }) => x.id === roleId);
        if (r) { setName(r.name || ""); setDescription(r.description || ""); setPerms(Array.isArray(r.permissions) ? r.permissions : []); }
      }
      setLoading(false);
    };
    run();
  }, [roleId]);

  async function save() {
    if (!firmId || !roleId) return;
    setSaving(true);
    try {
      await fetch(`/api/firms/${firmId}/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, permissions: perms }),
      });
      router.push(`/${locale}/firm/roles`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-[24px] font-bold text-gray-900">{locale === "ar" ? "تعديل الدور" : "Edit Role"}</h1>
      {loading ? (
        <div className="py-10 text-center">...</div>
      ) : (
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === "ar" ? "اسم الدور" : "Role name"} />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={locale === "ar" ? "الوصف" : "Description"} />
          <div className="bg-white border rounded-[12px] p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">{locale === "ar" ? "الصلاحيات" : "Permissions"}</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.values(PermissionKeys).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={perms.includes(k)}
                    onChange={(e) => {
                      if (e.target.checked) setPerms(Array.from(new Set([...perms, k])));
                      else setPerms(perms.filter((p) => p !== k));
                    }}
                  />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <ModalButton onClick={save} loading={saving}>{locale === "ar" ? "حفظ" : "Save"}</ModalButton>
          </div>
        </div>
      )}
    </div>
  );
}
