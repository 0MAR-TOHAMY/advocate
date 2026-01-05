"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const params = useParams();
    const locale = params?.locale as string || "en";
    const isRTL = locale === "ar";

    useEffect(() => {
        const root = document.documentElement;
        if (user?.primaryColor) {
            root.style.setProperty("--brand-primary", user.primaryColor);
        }
        if (user?.secondaryColor) {
            root.style.setProperty("--brand-secondary", user.secondaryColor);
        }

        return () => {
            root.style.removeProperty("--brand-primary");
            root.style.removeProperty("--brand-secondary");
        };
    }, [user?.primaryColor, user?.secondaryColor]);

    return (
        <div className="min-h-screen bg-[#F9FAFB] relative overflow-hidden">
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle, var(--brand-primary) 1px, transparent 1px)`,
                        backgroundSize: '22px 22px'
                    }}
                />
                <div className="absolute -top-24 -left-24 w-[380px] h-[380px] bg-brand-primary/5 rounded-full blur-3xl animate-float-slow" />
                <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-brand-secondary/5 rounded-full blur-3xl animate-float-medium" />
            </div>
            <SidebarProvider>
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <MainArea isRTL={isRTL}>{children}</MainArea>
                </div>
                <FloatingAssistant isRTL={isRTL} locale={locale} />
            </SidebarProvider>
        </div>
    );
}

function MainArea({ children, isRTL }: { children: React.ReactNode; isRTL: boolean }) {
    const { isCollapsed } = useSidebar();
    const marginClass = isRTL
        ? (isCollapsed ? "md:mr-[80px]" : "md:mr-[300px]")
        : (isCollapsed ? "md:ml-[80px]" : "md:ml-[300px]");
    return (
        <main className={`min-h-screen transition-all duration-300 pt-6 pb-10 px-4 md:px-8 relative z-10 ${marginClass}`}>
            {children}
        </main>
    );
}


