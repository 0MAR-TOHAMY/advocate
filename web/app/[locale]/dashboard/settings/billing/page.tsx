"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    CreditCard,
    Calendar,
    Users,
    HardDrive,
    Crown,
    AlertTriangle,
    Plus,
    Trash2,
    Loader2,
    CheckCircle
} from "lucide-react";
import Button from "@/components/ui/Button";

interface SubscriptionData {
    status: string;
    planName: string;
    planType: string;
    price: string;
    currency: string;
    billingPeriod: string;
    maxUsers: number | null;
    currentUsers: number;
    maxStorageGB: number | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
}

interface AddOn {
    id: string;
    name: string;
    storageSizeGB: number;
    priceMonthly: string;
    currency: string;
}

export default function BillingPage() {
    const t = useTranslations("sidebar");
    const params = useParams();
    const locale = (params?.locale as string) || "en";

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [purchasedAddOns, setPurchasedAddOns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [firmId, setFirmId] = useState("");

    const labels = {
        title: locale === "ar" ? "الفوترة والاشتراك" : "Billing & Subscription",
        subtitle: locale === "ar" ? "إدارة اشتراكك وطرق الدفع" : "Manage your subscription and billing",
        currentPlan: locale === "ar" ? "الخطة الحالية" : "Current Plan",
        status: locale === "ar" ? "الحالة" : "Status",
        renewalDate: locale === "ar" ? "تاريخ التجديد" : "Renewal Date",
        trialEnds: locale === "ar" ? "تنتهي الفترة التجريبية" : "Trial Ends",
        usage: locale === "ar" ? "الاستخدام" : "Usage",
        users: locale === "ar" ? "المستخدمين" : "Users",
        storage: locale === "ar" ? "التخزين" : "Storage",
        addOns: locale === "ar" ? "الإضافات" : "Add-ons",
        availableAddOns: locale === "ar" ? "الإضافات المتاحة" : "Available Add-ons",
        purchasedAddOns: locale === "ar" ? "الإضافات المشتراة" : "Purchased Add-ons",
        upgrade: locale === "ar" ? "ترقية الخطة" : "Upgrade Plan",
        purchase: locale === "ar" ? "شراء" : "Purchase",
        cancel: locale === "ar" ? "إلغاء" : "Cancel",
        perMonth: locale === "ar" ? "/شهرياً" : "/month",
        noAddOns: locale === "ar" ? "لا توجد إضافات" : "No add-ons",
        statusLabels: {
            trial: locale === "ar" ? "فترة تجريبية" : "Trial",
            active: locale === "ar" ? "نشط" : "Active",
            past_due: locale === "ar" ? "متأخر الدفع" : "Past Due",
            canceled: locale === "ar" ? "ملغى" : "Canceled",
            expired: locale === "ar" ? "منتهي" : "Expired",
            read_only: locale === "ar" ? "للقراءة فقط" : "Read Only",
        },
    };

    useEffect(() => {
        async function fetchData() {
            try {
                // Get user's firm ID
                const meRes = await fetch("/api/auth/me");
                const meData = await meRes.json();
                const fId = meData?.user?.firmId || "";
                setFirmId(fId);

                if (!fId) {
                    setLoading(false);
                    return;
                }

                // Fetch subscription
                const subRes = await fetch(`/api/firms/${fId}/subscription`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    setSubscription(subData.subscription);
                }

                // Fetch add-ons
                const addOnsRes = await fetch(`/api/firms/${fId}/add-ons`);
                if (addOnsRes.ok) {
                    const addOnsData = await addOnsRes.json();
                    setAvailableAddOns(addOnsData.available || []);
                    setPurchasedAddOns(addOnsData.purchased || []);
                }
            } catch {
                // Error handling
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-emerald-100 text-emerald-700";
            case "trial": return "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
            case "past_due": return "bg-amber-100 text-amber-700";
            case "canceled":
            case "expired":
            case "read_only": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
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

            {/* Subscription Status Warning */}
            {subscription && (subscription.status === "past_due" || subscription.status === "read_only") && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">
                            {locale === "ar" ? "الاشتراك يحتاج إلى إجراء" : "Subscription Requires Action"}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                            {locale === "ar"
                                ? "يرجى تحديث طريقة الدفع لتجنب تعطيل الخدمة."
                                : "Please update your payment method to avoid service interruption."
                            }
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Current Plan Card */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{labels.currentPlan}</h2>
                            <p className="text-2xl font-bold text-brand-primary">{subscription?.planName || "-"}</p>
                        </div>
                    </div>
                    {subscription && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                            {labels.statusLabels[subscription.status as keyof typeof labels.statusLabels] || subscription.status}
                        </span>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Price */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm">{locale === "ar" ? "السعر" : "Price"}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                            ${subscription?.price || "0"}{labels.perMonth}
                        </p>
                    </div>

                    {/* Users */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{labels.users}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                            {subscription?.currentUsers || 0} / {subscription?.maxUsers || "∞"}
                        </p>
                    </div>

                    {/* Renewal */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                                {subscription?.status === "trial" ? labels.trialEnds : labels.renewalDate}
                            </span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                            {formatDate(subscription?.status === "trial" ? subscription?.trialEndsAt : subscription?.currentPeriodEnd)}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button>{labels.upgrade}</Button>
                </div>
            </div>

            {/* Storage Add-ons */}
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-brand-primary" />
                    {labels.addOns}
                </h2>

                {/* Purchased Add-ons */}
                {purchasedAddOns.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">{labels.purchasedAddOns}</h3>
                        <div className="space-y-2">
                            {purchasedAddOns.map((addon) => (
                                <div key={addon.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span className="font-medium text-gray-900">{addon.name}</span>
                                        <span className="text-sm text-gray-600">+{addon.storageSizeGB}GB</span>
                                    </div>
                                    <button className="text-red-600 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Add-ons */}
                <h3 className="text-sm font-medium text-gray-600 mb-3">{labels.availableAddOns}</h3>
                {availableAddOns.length === 0 ? (
                    <p className="text-gray-500 text-sm">{labels.noAddOns}</p>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                        {availableAddOns.map((addon) => (
                            <div key={addon.id} className="border rounded-xl p-4 hover:border-brand-primary/30 transition-all hover:shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <HardDrive className="w-5 h-5 text-brand-primary" />
                                    <span className="font-medium text-gray-900">{addon.name}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">+{addon.storageSizeGB}GB {labels.storage}</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-brand-primary">
                                        ${addon.priceMonthly}{labels.perMonth}
                                    </span>
                                    <button className="flex items-center gap-1 text-sm text-brand-primary hover:opacity-80 font-medium">
                                        <Plus className="w-4 h-4" />
                                        {labels.purchase}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
