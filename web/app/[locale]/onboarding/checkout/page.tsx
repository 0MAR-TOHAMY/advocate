"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function OnboardingCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = (params?.locale as string) || "ar";
    const error = searchParams.get("error");
    const status: "loading" | "success" | "error" = error ? "error" : "loading";

    const t = {
        processing: locale === "ar" ? "جاري معالجة الدفع..." : "Processing payment...",
        success: locale === "ar" ? "تم الدفع بنجاح!" : "Payment successful!",
        redirect: locale === "ar" ? "جاري التحويل..." : "Redirecting...",
        error: locale === "ar" ? "حدث خطأ في الدفع" : "Payment error occurred",
        tryAgain: locale === "ar" ? "حاول مرة أخرى" : "Try Again",
        errorPaymentProcessing: locale === "ar"
            ? "لم نتمكن من تأكيد الدفع. يرجى المحاولة مرة أخرى."
            : "We couldn't confirm your payment. Please try again.",
    };

    if (status === "error") {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl text-center max-w-md"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.error}</h1>
                    <p className="text-gray-600 mb-8">{t.errorPaymentProcessing}</p>
                    <Button onClick={() => router.push(`/${locale}/onboarding/plan`)}>
                        {t.tryAgain}
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl text-center max-w-md"
            >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.processing}</h1>
                <p className="text-gray-600">{t.redirect}</p>
            </motion.div>
        </div>
    );
}
