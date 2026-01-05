"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Users,
    UserPlus,
    Shield,
    MoreVertical,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Crown
} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import { InviteMemberModal } from "@/components/firm/InviteMemberModal";

interface Member {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
    status: string;
    avatarUrl?: string;
}

interface Role {
    id: string;
    name: string;
}

interface JoinRequest {
    id: string;
    userId: string;
    status: string;
    createdAt: string;
    user?: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
}

interface UsageData {
    users: {
        current: number;
        max: number | null;
        percent: number;
    };
    metrics?: {
        tag: string | null;
    };
}

export default function TeamPage() {
    const t = useTranslations("team");
    const params = useParams();
    const locale = (params?.locale as string) || "en";

    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [firmId, setFirmId] = useState("");
    const [actionLoading, setActionLoading] = useState<string>("");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    async function fetchData() {
        try {
            const meRes = await fetch("/api/auth/me");
            const meData = await meRes.json();
            const fId = meData?.user?.firmId || "";
            setFirmId(fId);

            if (!fId) return;

            const [membersRes, rolesRes, requestsRes, usageRes] = await Promise.all([
                fetch(`/api/firms/${fId}/users`),
                fetch(`/api/firms/${fId}/roles`),
                fetch(`/api/firms/${fId}/requests`),
                fetch(`/api/firms/${fId}/usage`),
            ]);

            if (membersRes.ok) {
                const data = await membersRes.json();
                setMembers(data.members || []);
            }
            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.roles || []);
            }
            if (requestsRes.ok) {
                const data = await requestsRes.json();
                // Need to fetch user details for requests if not included
                // Assuming the API might need adjustment or we fetch users separately
                // For now, let's assume the API returns user info or we handle it
                setRequests(data.requests || []);
            }
            if (usageRes.ok) {
                const data = await usageRes.json();
                setUsage(data.usage);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    async function handleRoleChange(memberId: string, roleId: string) {
        setActionLoading(memberId);
        try {
            await fetch(`/api/firms/${firmId}/users/${memberId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleId: roleId || null }),
            });
            await fetchData();
        } finally {
            setActionLoading("");
        }
    }

    async function handleRequest(requestId: string, action: "approve" | "reject") {
        setActionLoading(requestId);
        try {
            await fetch(`/api/firms/${firmId}/requests/${requestId}/${action}`, {
                method: "POST",
            });
            await fetchData();
        } finally {
            setActionLoading("");
        }
    }

    async function handleDeleteMember(memberId: string) {
        if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا العضو؟" : "Are you sure you want to delete this member?")) return;
        setActionLoading(memberId);
        try {
            await fetch(`/api/firms/${firmId}/users/${memberId}`, {
                method: "DELETE",
            });
            await fetchData();
        } finally {
            setActionLoading("");
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader />
            </div>
        );
    }

    const isLimitReached = usage?.users.max && usage.users.current >= usage.users.max;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">{t("title")}</h1>
                    <p className="text-gray-500 text-[14px]">{t("subtitle")}</p>
                </div>

                <div className="flex items-center gap-3">
                    {isLimitReached ? (
                        <Button variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                            <Crown className="w-4 h-4 me-2" />
                            {t("upgrade")}
                        </Button>
                    ) : (
                        <Button onClick={() => setIsInviteModalOpen(true)}>
                            <UserPlus className="w-4 h-4 me-2" />
                            {t("invite")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Seat Usage Banner */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center ${isLimitReached ? "bg-amber-100 text-amber-600" : "bg-brand-primary/10 text-brand-primary"}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {usage?.users.current || 0} / {usage?.users.max || t("unlimited")} {t("members")}
                        </h3>
                        <div className="w-48 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isLimitReached ? "bg-amber-500" : "bg-brand-primary"}`}
                                style={{ width: `${usage?.users.percent || 0}%` }}
                            />
                        </div>
                    </div>
                </div>
                {isLimitReached && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {t("limitReached")}
                    </div>
                )}
            </div>

            {/* Join Requests */}
            {requests.length > 0 && (
                <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px] overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">{t("requests")}</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {req.user?.avatarUrl ? (
                                        <img
                                            src={req.user.avatarUrl}
                                            alt={req.user.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-100 shadow-sm transition-all hover:bg-gray-200">
                                            {(req.user?.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-900">{req.user?.name || `User: ${req.userId}`}</p>
                                        <p className="text-sm text-gray-500">{req.user?.email || new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleRequest(req.id, "approve")}
                                        loading={actionLoading === req.id}
                                        disabled={!!isLimitReached}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <CheckCircle className="w-4 h-4 me-1" />
                                        {t("approve")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleRequest(req.id, "reject")}
                                        loading={actionLoading === req.id}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4 me-1" />
                                        {t("reject")}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[25px] overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{t("members")}</h2>
                    <Link href={`/${locale}/dashboard/firm/settings`} className="text-[13px] text-brand-primary hover:underline flex items-center gap-1 font-medium">
                        <Shield className="w-4 h-4" />
                        {t("manageRoles")}
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-start text-[12px] font-semibold text-gray-600 uppercase">{t("members")}</th>
                                <th className="px-6 py-4 text-start text-[12px] font-semibold text-gray-600 uppercase">{t("role")}</th>
                                <th className="px-6 py-4 text-start text-[12px] font-semibold text-gray-600 uppercase">{t("status")}</th>
                                <th className="px-6 py-4 text-end text-[12px] font-semibold text-gray-600 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <Users className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <h3 className="text-[14px] font-medium text-gray-900 mb-1">{t("noMembers")}</h3>
                                            <p className="text-[12px] text-gray-500">{t("noMembersMessage")}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : members.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 group">
                                            {m.avatarUrl ? (
                                                <img
                                                    src={m.avatarUrl}
                                                    alt={m.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-50 shadow-sm transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105 border border-brand-primary/20">
                                                    {(m.name || "U").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900 transition-colors">{m.name}</p>
                                                <p className="text-sm text-gray-500">{m.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                            {(() => {
                                                const roleName = roles.find(r => r.id === m.roleId)?.name || "member";
                                                return t.has(`roles.${roleName}`) ? t(`roles.${roleName}`) : roleName;
                                            })()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                                            {t.has(`statuses.${m.status}`) ? t(`statuses.${m.status}`) : m.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-end">
                                        <button
                                            onClick={() => handleDeleteMember(m.id)}
                                            disabled={actionLoading === m.id}
                                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === m.id ? <Loader size={16} /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                firmId={firmId}
                firmTag={usage?.metrics?.tag || ""}
            />
        </div>
    );
}
