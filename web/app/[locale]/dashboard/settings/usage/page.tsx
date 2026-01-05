"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, HardDrive, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface UsageData {
    users: {
        current: number;
        max: number | null;
        percent: number;
    };
    storage: {
        usedBytes: string;
        totalBytes: string;
        used: { value: string; unit: string };
        total: { value: string; unit: string };
        percent: number;
        additionalGB: number;
    };
}

export default function UsagePage() {
    const params = useParams();
    const locale = (params?.locale as string) || "en";

    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    const labels = {
        title: locale === "ar" ? "استخدام الموارد" : "Resource Usage",
        subtitle: locale === "ar" ? "مراقبة استخدام المكتب للموارد" : "Monitor your firm's resource usage",
        users: locale === "ar" ? "المستخدمين" : "Users",
        usersDesc: locale === "ar" ? "أعضاء الفريق النشطين" : "Active team members",
        storage: locale === "ar" ? "التخزين" : "Storage",
        storageDesc: locale === "ar" ? "المساحة المستخدمة للملفات" : "Space used for files",
        addOnStorage: locale === "ar" ? "تخزين إضافي" : "Additional Storage",
        unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
        used: locale === "ar" ? "مستخدم" : "used",
        of: locale === "ar" ? "من" : "of",
        upgradeHint: locale === "ar"
            ? "قم بترقية خطتك للحصول على المزيد من الموارد"
            : "Upgrade your plan for more resources",
        addStorageHint: locale === "ar"
            ? "أضف تخزين إضافي من صفحة الفوترة"
            : "Add more storage from the billing page",
    };

    useEffect(() => {
        async function fetchUsage() {
            try {
                const meRes = await fetch("/api/auth/me");
                const meData = await meRes.json();
                const firmId = meData?.user?.firmId || "";

                if (!firmId) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(`/api/firms/${firmId}/usage`);
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data.usage);
                }
            } catch {
                // Error handling
            } finally {
                setLoading(false);
            }
        }
        fetchUsage();
    }, []);

    const getProgressColor = (percent: number) => {
        if (percent >= 90) return "bg-red-500";
        if (percent >= 70) return "bg-amber-500";
        return "bg-blue-500";
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-bold text-gray-900">{labels.title}</h1>
                <p className="text-gray-500 text-[14px]">{labels.subtitle}</p>
            </div>

            {/* Usage Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Users Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{labels.users}</h2>
                            <p className="text-sm text-gray-500">{labels.usersDesc}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {usage?.users.current || 0}
                            </span>
                            <span className="text-gray-500">
                                {labels.of} {usage?.users.max || labels.unlimited}
                            </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usage?.users.percent || 0}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full rounded-full ${getProgressColor(usage?.users.percent || 0)}`}
                            />
                        </div>
                    </div>

                    {usage && usage.users.max && usage.users.percent >= 80 && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{labels.upgradeHint}</span>
                        </div>
                    )}
                </motion.div>

                {/* Storage Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <HardDrive className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{labels.storage}</h2>
                            <p className="text-sm text-gray-500">{labels.storageDesc}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {usage?.storage.used.value || "0"} {usage?.storage.used.unit || "MB"}
                            </span>
                            <span className="text-gray-500">
                                {labels.of} {usage?.storage.total.value || "0"} {usage?.storage.total.unit || "GB"}
                            </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usage?.storage.percent || 0}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full rounded-full ${getProgressColor(usage?.storage.percent || 0)}`}
                            />
                        </div>
                    </div>

                    {usage?.storage.additionalGB && usage.storage.additionalGB > 0 && (
                        <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg mb-4">
                            +{usage.storage.additionalGB}GB {labels.addOnStorage}
                        </div>
                    )}

                    {usage && usage.storage.percent >= 80 && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{labels.addStorageHint}</span>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
