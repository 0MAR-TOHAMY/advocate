"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, Zap, Crown, Star, Building2, Gift,
    ArrowRight, Users, HardDrive, Calendar, Check,
    AlertTriangle, RefreshCw, Plus, LayoutGrid, TrendingUp, TrendingDown, X
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import ModalButton from "@/components/ui/ModalButton";

interface Plan {
    id: string;
    planType: string;
    name: string;
    description: string;
    pricePerUserMonthly: number;
    pricePerUserYearly: number | null;
    maxUsers: number | null;
    storagePerUserGB: number | null;
    isContactSales: boolean;
}

interface Subscription {
    id: string;
    planId: string;
    status: string;
    billingPeriod: string;
    seatCount: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt: string | null;
    downgradeToPlanId: string | null;
}

interface FirmUsage {
    currentUsers: number;
    maxUsers: number | null;
    storageUsedBytes: string;
    maxStorageBytes: string | null;
}

export default function SubscriptionPage() {
    const t = useTranslations("subscription");
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const isRTL = locale === 'ar';

    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [usage, setUsage] = useState<FirmUsage | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<any[]>([]);
    const [purchasedAddOns, setPurchasedAddOns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [loadingAddOn, setLoadingAddOn] = useState<string | null>(null);
    const [firmId, setFirmId] = useState<string | null>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'upgrade' | 'downgrade';
        planId: string;
        planName: string;
    } | null>(null);

    const statusColors: Record<string, string> = {
        trial: "bg-emerald-50 text-emerald-700 border-emerald-100",
        active: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
        past_due: "bg-red-50 text-red-700 border-red-100",
        canceled: "bg-gray-50 text-gray-700 border-gray-100",
        read_only: "bg-yellow-50 text-yellow-700 border-yellow-100",
    };

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [plansRes, subRes] = await Promise.all([
                fetch("/api/plans"),
                fetch("/api/subscription"),
            ]);

            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data.plans || []);
            }

            if (subRes.ok) {
                const data = await subRes.json();
                setSubscription(data.subscription || null);
                setCurrentPlan(data.currentPlan || null);
                setUsage(data.usage || null);

                // Fetch add-ons
                const meRes = await fetch("/api/auth/me");
                const meData = await meRes.json();
                const fId = meData?.user?.firmId;
                if (fId) {
                    setFirmId(fId);
                    const addOnsRes = await fetch(`/api/firms/${fId}/add-ons`);
                    if (addOnsRes.ok) {
                        const addOnsData = await addOnsRes.json();
                        setAvailableAddOns(addOnsData.available || []);
                        setPurchasedAddOns(addOnsData.purchased || []);
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleAddOn(addOnId: string) {
        if (!firmId) return;
        setLoadingAddOn(addOnId);
        try {
            const res = await fetch(`/api/firms/${firmId}/add-ons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addOnId }),
            });

            const data = await res.json();
            if (res.ok) {
                await loadData();
            } else {
                console.error("Failed to purchase add-on:", data.message || res.statusText);
                alert(data.message || "Failed to purchase add-on");
            }
        } catch (error) {
            console.error("Add-on purchase error:", error);
        } finally {
            setLoadingAddOn(null);
        }
    }

    function formatBytes(bytes: string | number) {
        const num = typeof bytes === "string" ? parseInt(bytes) : bytes;
        if (!num || num === 0) return "0 GB";
        const gb = num / (1024 * 1024 * 1024);
        return gb.toFixed(2) + " GB";
    }

    function formatPrice(cents: number) {
        return (cents / 100).toFixed(0);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function getDaysRemaining(dateString: string) {
        const end = new Date(dateString);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    function showUpgradeConfirm(planId: string, planName: string) {
        setConfirmDialog({ isOpen: true, type: 'upgrade', planId, planName });
    }

    function showDowngradeConfirm(planId: string, planName: string) {
        setConfirmDialog({ isOpen: true, type: 'downgrade', planId, planName });
    }

    async function handleUpgrade(planId: string) {
        setConfirmDialog(null);
        setActionLoading(planId);
        try {
            const res = await fetch("/api/subscription/upgrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, billingPeriod: subscription?.billingPeriod || "monthly" }),
            });

            if (res.ok) {
                const data = await res.json();

                // Redirect to checkout if needed
                if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                    return;
                }

                // Redirect to billing portal if payment method needs update
                if (data.portalUrl) {
                    window.location.href = data.portalUrl;
                    return;
                }

                // Success - reload data
                if (data.success) {
                    await loadData();
                }
            } else {
                const errorData = await res.json();
                console.error("Upgrade failed:", errorData.message);
            }
        } catch (error) {
            console.error("Upgrade error:", error);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDowngrade(planId: string) {
        setConfirmDialog(null);
        setActionLoading(planId);
        try {
            const res = await fetch("/api/subscription/downgrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            if (res.ok) {
                await loadData();
            } else {
                console.error("Downgrade failed:", await res.text());
            }
        } catch (error) {
            console.error("Downgrade error:", error);
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    const isTrialing = subscription?.status === "trial";
    const trialDaysLeft = subscription?.trialEndsAt ? getDaysRemaining(subscription.trialEndsAt) : 0;

    return (
        <div className="space-y-10 max-w-6xl mx-auto px-4 pb-20 select-none" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-black text-gray-900 leading-tight">{t("title")}</h1>
                    <p className="text-gray-500 text-[15px] font-medium mt-1">{t("subtitle")}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        const res = await fetch("/api/billing/portal");
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                    }}
                    className="rounded-2xl h-12 px-6 font-bold border-gray-200 hover:bg-gray-50 bg-white"
                >
                    <CreditCard className="w-4 h-4 me-2" />
                    {t("manageBilling")}
                </Button>
            </div>

            {/* Past Due Warning */}
            {subscription?.status === "past_due" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 rounded-[24px] p-6 flex flex-col md:flex-row items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-center md:text-start">
                        <p className="font-black text-red-950 text-lg">{t("pastDueWarning")}</p>
                        <p className="text-sm font-bold text-red-600/80">{t("pastDueMessage")}</p>
                    </div>
                    <Button className="rounded-xl h-12 px-8 bg-red-600 hover:bg-red-700 font-bold" onClick={async () => {
                        const res = await fetch("/api/billing/portal");
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                    }}>
                        {t("updatePayment")}
                    </Button>
                </motion.div>
            )}

            {/* Current Plan Overview */}
            {currentPlan && (
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 space-y-10">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-gray-50">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={cn("px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest border", statusColors[subscription?.status || "active"])}>
                                    {t(`status.${subscription?.status || "active"}`)}
                                </span>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{currentPlan.name}</h2>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-100 text-center min-w-[300px]">
                            {currentPlan.planType !== "free" ? (
                                <>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-black text-gray-900">
                                            ${formatPrice(subscription?.billingPeriod === "yearly"
                                                ? (currentPlan.pricePerUserYearly || currentPlan.pricePerUserMonthly * 12 * 0.8)
                                                : (subscription?.seatCount || 1) * currentPlan.pricePerUserMonthly)}
                                        </span>
                                        {subscription?.billingPeriod === "monthly" && (
                                            <span className="text-gray-400 font-bold text-sm tracking-tight">{t("perUser")}</span>
                                        )}
                                        <p className="text-gray-400 text-xs font-black uppercase mt-2 tracking-widest">
                                            {subscription?.billingPeriod === "yearly" ? t("perYear") : t("perMonth")}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <span className="text-3xl font-black text-emerald-600 uppercase tracking-widest">{t("free")}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* User Seats */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-300" />
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("seats")}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">
                                    {usage?.currentUsers || 1} / {(!usage?.maxUsers || usage.maxUsers > 9999) ? t("unlimited") : usage.maxUsers}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (usage?.currentUsers || 1) / (usage?.maxUsers || 100) * 100)}%` }}
                                    className={cn("h-full rounded-full transition-all duration-1000", (usage?.currentUsers || 1) >= (usage?.maxUsers || 999) ? "bg-amber-500" : "bg-brand-primary")}
                                />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide">{t("seatDescription")}</p>
                        </div>

                        {/* Storage Usage */}
                        <div className="space-y-4">
                            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                    <HardDrive className="w-5 h-5 text-gray-300" />
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("storage")}</span>
                                </div>
                                <span className={cn("text-sm font-black text-gray-900", isRTL && "direction-ltr")} dir="ltr">
                                    {formatBytes(usage?.storageUsedBytes || 0)} / {(!currentPlan?.storagePerUserGB || usage?.maxStorageBytes === null) ? t("unlimited") : formatBytes(usage?.maxStorageBytes || 0)}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(!currentPlan?.storagePerUserGB || (usage?.maxStorageBytes && parseInt(usage.maxStorageBytes) > 100 * 1024 * 1024 * 1024 * 1024)) ? 1 : Math.min(100, (parseInt(usage?.storageUsedBytes || "0") / (usage?.maxStorageBytes ? parseInt(usage.maxStorageBytes) : 1000 * 1024 * 1024 * 1024)) * 100)}%` }}
                                    className="h-full bg-brand-primary rounded-full transition-all duration-1000"
                                />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide">{t("storageDescription")}</p>
                        </div>

                        {/* Billing Cycle */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-300" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{isTrialing ? t("trialEnds") : t("nextBilling")}</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <p className="text-lg font-black text-gray-900">
                                    {isTrialing && subscription?.trialEndsAt
                                        ? `${trialDaysLeft} ${t("daysLeft")}`
                                        : subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "-"
                                    }
                                </p>
                                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                            </div>
                        </div>
                    </div>

                    {/* Pending Downgrade Notice */}
                    {subscription?.downgradeToPlanId && (
                        <div className="bg-amber-50 border border-amber-100 rounded-[20px] p-5 flex items-center gap-4">
                            <RefreshCw className="w-5 h-5 text-amber-600" />
                            <div className="text-sm font-bold text-amber-900">
                                <p>{t("pendingDowngrade")}</p>
                                <p className="text-amber-700/80 font-medium">{t("downgradeEffective", { date: formatDate(subscription.currentPeriodEnd) })}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Available Plans - Horizontal Row */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <LayoutGrid className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t("availablePlans")}</h3>
                </div>

                <div className="space-y-3">
                    {plans.filter((p) => p.id !== currentPlan?.id).map((plan) => {
                        // Compare by price - if current plan price is higher than this plan, it's a downgrade
                        const currentPlanPrice = currentPlan?.pricePerUserMonthly || 0;
                        const thisPlanPrice = plan.pricePerUserMonthly || 0;
                        const isCurrentHigher = currentPlanPrice > thisPlanPrice;

                        return (
                            <div
                                key={plan.id}
                                className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between group hover:border-brand-primary/30 transition-all duration-300 hover:shadow-sm"
                            >
                                <div className="flex items-center gap-6">
                                    <h4 className="font-black text-lg text-gray-900 min-w-[140px]">{plan.name}</h4>
                                    <p className="text-sm font-medium text-gray-400 line-clamp-1 max-w-md hidden md:block">{plan.description}</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    {plan.planType !== "free" && !plan.isContactSales && (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-gray-900">${formatPrice(plan.pricePerUserMonthly)}</span>
                                            <span className="text-gray-400 font-bold text-xs">/{t("user")}/{t("month")}</span>
                                        </div>
                                    )}
                                    {plan.isContactSales && (
                                        <span className="text-sm font-black text-brand-primary uppercase">{t("contactSales")}</span>
                                    )}

                                    {!plan.isContactSales && (
                                        <ModalButton
                                            color={isCurrentHigher ? "gray" : "blue"}
                                            className="rounded-xl !px-4 !py-2 !min-h-fit font-black text-xs"
                                            onClick={() => (isCurrentHigher ? showDowngradeConfirm(plan.id, plan.name) : showUpgradeConfirm(plan.id, plan.name))}
                                            loading={actionLoading === plan.id}
                                            disabled={actionLoading !== null}
                                        >
                                            {isCurrentHigher ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                        </ModalButton>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Storage Add-ons - Horizontal Row */}
            <div className="bg-slate-900 rounded-[28px] p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HardDrive className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xl font-black text-white tracking-tight">{t("addOns")}</h3>
                    </div>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t("storageExtra")}</span>
                </div>

                {purchasedAddOns.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Check className="w-3 h-3" />
                            {t("activeAddOns")}
                        </h4>
                        <div className="space-y-2">
                            {purchasedAddOns.map((addon) => (
                                <div key={addon.id} className="bg-white/10 px-5 py-3 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-white">{addon.name}</span>
                                        <span className="text-xs font-bold text-slate-400">+{addon.storageSizeGB} GB</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-emerald-400 font-black text-sm">${addon.priceMonthly}</span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            {addon.expiresAt ? `${t("expires")}: ${formatDate(addon.expiresAt)}` : t("active")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {availableAddOns.map((addon) => (
                        <div key={addon.id} className="bg-white/5 px-5 py-3 rounded-xl border border-white/5 hover:border-brand-primary/30 transition-all flex items-center justify-center">
                            <div className="flex items-center gap-4 flex-1">
                                <span className="font-black text-white">{addon.name}</span>
                                <span className="text-xs font-bold text-slate-500">+{addon.storageSizeGB} GB</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-white font-black">${addon.priceMonthly}<span className="text-slate-500 text-xs font-bold"> /{t("month")}</span></span>
                                {purchasedAddOns.some(p => p.addOnId === addon.id && p.status === 'active') ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20 uppercase tracking-wider">
                                        {t("active")}
                                    </span>
                                ) : (
                                    <ModalButton
                                        className="rounded-xl !px-4 !py-2 !min-h-fit font-black text-xs"
                                        onClick={() => handleAddOn(addon.id)}
                                        loading={loadingAddOn === addon.id}
                                        disabled={!!loadingAddOn}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </ModalButton>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
      `}</style>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {confirmDialog?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setConfirmDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[28px] p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmDialog.type === 'upgrade' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                    {confirmDialog.type === 'upgrade' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                </div>
                                <button onClick={() => setConfirmDialog(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-2">
                                {confirmDialog.type === 'upgrade'
                                    ? (locale === 'ar' ? 'تأكيد الترقية' : 'Confirm Upgrade')
                                    : (locale === 'ar' ? 'تأكيد تقليل الخطة' : 'Confirm Downgrade')}
                            </h3>

                            <p className="text-gray-500 font-medium mb-6 leading-relaxed">
                                {confirmDialog.type === 'upgrade'
                                    ? (locale === 'ar'
                                        ? `سيتم ترقية خطتك إلى "${confirmDialog.planName}" وسيتم احتساب فرق السعر فوراً. هل تريد المتابعة؟`
                                        : `Your plan will be upgraded to "${confirmDialog.planName}" and you will be charged the prorated difference immediately. Continue?`)
                                    : (locale === 'ar'
                                        ? `سيتم جدولة التقليل إلى "${confirmDialog.planName}" وسيُطبق في نهاية فترة الفوترة الحالية. هل تريد المتابعة؟`
                                        : `Your downgrade to "${confirmDialog.planName}" will be scheduled and applied at the end of your current billing period. Continue?`)}
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-2xl font-bold"
                                    onClick={() => setConfirmDialog(null)}
                                >
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    className={`flex-1 h-12 rounded-2xl font-bold ${confirmDialog.type === 'upgrade' ? 'bg-brand-primary hover:opacity-90' : 'bg-amber-600 hover:bg-amber-700'}`}
                                    onClick={() => confirmDialog.type === 'upgrade' ? handleUpgrade(confirmDialog.planId) : handleDowngrade(confirmDialog.planId)}
                                >
                                    {confirmDialog.type === 'upgrade'
                                        ? (locale === 'ar' ? 'ترقية الآن' : 'Upgrade Now')
                                        : (locale === 'ar' ? 'تأكيد التقليل' : 'Confirm Downgrade')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
