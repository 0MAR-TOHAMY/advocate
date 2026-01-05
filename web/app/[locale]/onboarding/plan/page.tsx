"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Building2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";

interface Plan {
    id: string;
    planType: string;
    name: string;
    description: string;
    pricePerUserMonthly: number;
    pricePerUserYearly: number | null;
    minUsers: number;
    maxUsers: number | null;
    storagePerUserGB: number | null;
    trialDays: number;
    isContactSales: boolean;
}

export default function OnboardingPlanPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "ar";
    const isRTL = locale === "ar";
    const t = useTranslations("onboarding");
    const { authenticatedFetch } = useAuth();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState("");

    // Carousel state
    const [activeIndex, setActiveIndex] = useState(1);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch("/api/plans");
                if (res.ok) {
                    const data = await res.json();
                    const fetchedPlans = (data.plans || []) as Plan[];
                    setPlans(fetchedPlans);

                    const proIndex = fetchedPlans.findIndex((p) => p.planType === "professional");
                    const initialIdx = proIndex !== -1 ? proIndex : Math.floor(fetchedPlans.length / 2);
                    setActiveIndex(initialIdx);
                    setSelectedPlan(fetchedPlans[initialIdx]?.id || null);
                }
            } catch {
                setError(t("errorLoadingPlans"));
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, [t]);

    const handleNext = () => {
        if (isRTL) setActiveIndex((prev) => (prev - 1 + plans.length) % plans.length);
        else setActiveIndex((prev) => (prev + 1) % plans.length);
    };

    const handlePrev = () => {
        if (isRTL) setActiveIndex((prev) => (prev + 1) % plans.length);
        else setActiveIndex((prev) => (prev - 1 + plans.length) % plans.length);
    };

    async function handleContinue() {
        if (!selectedPlan) return;
        setCheckoutLoading(true);
        setError("");

        try {
            const plan = plans.find((p) => p.id === selectedPlan);
            if (!plan) {
                setError(t("planNotFound"));
                setCheckoutLoading(false);
                return;
            }

            const res = await authenticatedFetch("/api/onboarding/create-draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: selectedPlan,
                    billingPeriod,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || t("errorCreatingDraft"));
                setCheckoutLoading(false);
                return;
            }

            const { draftId, isFree, checkoutUrl } = await res.json();
            if (isFree) {
                router.push(`/${locale}/onboarding/firm-profile?draftId=${draftId}`);
            } else if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
        } catch {
            setError(t("errorOccurred"));
            setCheckoutLoading(false);
        }
    }

    const formatPrice = (cents: number) => (cents / 100).toFixed(0);
    const getPrice = (plan: Plan) => {
        if (billingPeriod === "monthly") return formatPrice(plan.pricePerUserMonthly);
        if (plan.pricePerUserYearly) return formatPrice(plan.pricePerUserYearly);
        return formatPrice(plan.pricePerUserMonthly * 12 * 0.8 / 12);
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader />
        </div>
    );

    const BackIcon = isRTL ? ChevronRight : ChevronLeft;

    return (
        <div className="h-screen bg-white relative overflow-hidden font-sans selection:bg-blue-100 flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
            {/* Background: Subtle Lights */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-50/30 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 h-full flex flex-col py-6">

                {/* Top Bar */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-white">
                            <Building2 className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-black text-slate-900">ADVOCATE</span>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => router.push(`/${locale}/onboarding/start`)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors font-bold text-[10px]"
                    >
                        <BackIcon className="w-3.5 h-3.5" />
                        <span>{t("back")}</span>
                    </motion.button>
                </div>

                {/* Header */}
                <div className="text-center mb-6 shrink-0">
                    <motion.h1 initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl font-black text-slate-800 mb-1 tracking-tight">
                        {isRTL ? "اختر خطتك" : "Choose Plan"}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {isRTL ? "بسيطة ومرنة." : "Simple and Flexible."}
                    </motion.p>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-2 bg-red-50 border border-red-100 rounded-lg"
                            >
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Billing Toggle */}
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-6 shrink-0">
                    <div className="bg-slate-50 p-0.5 rounded-lg flex items-center border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setBillingPeriod("monthly")}
                            className={`relative px-4 py-1 rounded-md text-[9px] font-black transition-all ${billingPeriod === "monthly" ? "text-slate-900" : "text-slate-400"}`}
                        >
                            {billingPeriod === "monthly" && <motion.div layoutId="pillS" className="absolute inset-0 bg-white rounded-md shadow-sm z-0" />}
                            <span className="relative z-10">{t("monthly")}</span>
                        </button>
                        <button
                            onClick={() => setBillingPeriod("yearly")}
                            className={`relative px-4 py-1 rounded-md text-[9px] font-black transition-all ${billingPeriod === "yearly" ? "text-slate-900" : "text-slate-400"}`}
                        >
                            {billingPeriod === "yearly" && <motion.div layoutId="pillS" className="absolute inset-0 bg-white rounded-md shadow-sm z-0" />}
                            <div className="relative z-10 flex items-center gap-1">
                                <span>{t("yearly")}</span>
                                <span className="text-[7px] text-emerald-500 font-black">-20%</span>
                            </div>
                        </button>
                    </div>
                </motion.div>

                {/* Carousel */}
                <div className="flex-1 relative flex items-center justify-center min-h-0 py-2">
                    <button onClick={handlePrev} className={`absolute ${isRTL ? 'right-0' : 'left-0'} z-30 w-7 h-7 rounded-sm bg-white/50 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all`}>
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={handleNext} className={`absolute ${isRTL ? 'left-0' : 'right-0'} z-30 w-7 h-7 rounded-sm bg-white/50 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all`}>
                        {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-4 w-full justify-center overflow-visible">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {plans.map((plan, index) => {
                                const isFocused = hoverIndex === null ? activeIndex === index : hoverIndex === index;
                                const distance = Math.abs(index - activeIndex);
                                if (distance > 1) return null;

                                return (
                                    <motion.div
                                        key={plan.id}
                                        layout
                                        onMouseEnter={() => setHoverIndex(index)}
                                        onMouseLeave={() => setHoverIndex(null)}
                                        onClick={() => { setActiveIndex(index); setSelectedPlan(plan.id); }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            scale: isFocused ? 1 : 0.85,
                                            opacity: isFocused ? 1 : 0.3,
                                            zIndex: isFocused ? 20 : 10,
                                        }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`
                                            relative w-[220px] md:w-[260px] ${isFocused ? 'h-[280px]' : 'h-[240px]'} bg-white rounded-2xl p-5 flex flex-col
                                            transition-all duration-500 cursor-pointer border shadow-sm
                                            ${isFocused ? `border-slate-200 shadow-md` : 'border-slate-100 shadow-none'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-base font-black text-slate-800">{plan.name}</h3>
                                            {plan.planType === "professional" && <span className="text-[6px] font-black px-1 py-0.5 rounded bg-blue-50 text-blue-500 uppercase">POPULAR</span>}
                                        </div>

                                        <div className="mb-3">
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-2xl font-black text-slate-900">${getPrice(plan)}</span>
                                                <span className="text-slate-400 font-bold text-[7px] uppercase tracking-tighter">/ {t("user")}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto no-scrollbar">
                                            <AnimatePresence>
                                                {isFocused && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Check className="w-2 h-2 text-emerald-500" />
                                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                                                                    {plan.maxUsers ? `${plan.minUsers}-${plan.maxUsers} ${t("users")}` : t("unlimitedUsers")}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Check className="w-2 h-2 text-emerald-500" />
                                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                                                                    {plan.storagePerUserGB ? `${plan.storagePerUserGB}GB / ${t("user")}` : t("unlimitedStorage")}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Check className="w-2 h-2 text-emerald-500" />
                                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{t("trial45Days")}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="mt-2 shrink-0">
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); if (isFocused) handleContinue(); }}
                                                disabled={checkoutLoading || plan.isContactSales}
                                                className={`
                                                    w-full h-8 rounded-lg font-black text-[8px] transition-all uppercase tracking-widest
                                                    ${isFocused ? 'bg-slate-900 text-white hover:bg-black' : 'bg-transparent text-transparent pointer-events-none'}
                                                `}
                                            >
                                                {plan.isContactSales ? t("contactSales") : `Select`}
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Dots */}
                <div className="shrink-0 flex flex-col items-center gap-3 py-4">
                    <div className="flex items-center gap-1">
                        {plans.map((_, i) => (
                            <button key={i} onClick={() => setActiveIndex(i)} className={`h-0.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-slate-900 w-3' : 'bg-slate-200 w-0.5'}`} />
                        ))}
                    </div>

                    <div className="opacity-20 flex items-center gap-2">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span className="text-[6px] font-black uppercase tracking-[1.5px]">Secure Payment</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
