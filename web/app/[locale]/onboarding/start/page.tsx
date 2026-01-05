"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Users, ArrowLeft, ArrowRight } from "lucide-react";

export default function OnboardingStartPage() {
    const params = useParams();
    const locale = (params?.locale as string) || "ar";
    const isRTL = locale === "ar";

    const t = {
        title: locale === "ar" ? "مرحباً بك في أدفوكيت" : "Welcome to Advocate",
        subtitle: locale === "ar"
            ? "اختر كيف تريد البدء"
            : "Choose how you want to get started",
        createOffice: locale === "ar" ? "إنشاء مكتب" : "Create Office",
        createDesc: locale === "ar"
            ? "أنشئ مكتب محاماة جديد وكن المالك"
            : "Create a new law firm and become the owner",
        joinOffice: locale === "ar" ? "الانضمام إلى مكتب" : "Join an Office",
        joinDesc: locale === "ar"
            ? "انضم إلى مكتب موجود كعضو في الفريق"
            : "Join an existing firm as a team member",
    };

    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {t.title}
                    </h1>
                    <p className="text-lg text-gray-600">{t.subtitle}</p>
                </motion.div>

                {/* Options Grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
                    {/* Create Office */}
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Link href={`/${locale}/onboarding/plan`}>
                            <div className="group relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <Building2 className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                        {t.createOffice}
                                    </h2>
                                    <p className="text-gray-600 mb-6">{t.createDesc}</p>
                                    <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                                        <span>{locale === "ar" ? "ابدأ الآن" : "Get Started"}</span>
                                        <ArrowIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Join Office */}
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Link href={`/${locale}/firms/join`}>
                            <div className="group relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                        {t.joinOffice}
                                    </h2>
                                    <p className="text-gray-600 mb-6">{t.joinDesc}</p>
                                    <div className="flex items-center gap-2 text-emerald-600 font-medium group-hover:gap-3 transition-all">
                                        <span>{locale === "ar" ? "البحث عن مكتب" : "Find an Office"}</span>
                                        <ArrowIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
