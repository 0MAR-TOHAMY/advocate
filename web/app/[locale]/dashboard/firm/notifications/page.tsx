"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Bell, CheckCheck, AlertTriangle, Info, XCircle,
    ExternalLink, CreditCard, Users, Shield, Settings2,
    Calendar, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    severity: string;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function FirmNotificationsPage() {
    const params = useParams();
    const router = useRouter();
    const locale = params?.locale as string || "en";
    const isRTL = locale === "ar";
    const t = useTranslations("notifications");
    const tCommon = useTranslations("common");

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [firmId, setFirmId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user?.firmId) {
                    setFirmId(data.user.firmId);
                } else {
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!firmId) return;
        fetch(`/api/firms/${firmId}/notifications`).then(res => res.json()).then(data => {
            setNotifications(data.notifications || []);
        }).finally(() => setLoading(false));
    }, [firmId]);

    const markAsRead = async (notificationId?: string) => {
        if (!firmId) return;
        await fetch(`/api/firms/${firmId}/notifications`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notificationId ? { notificationId } : { markAllRead: true }),
        });
        setNotifications(prev =>
            prev.map(n => notificationId ? (n.id === notificationId ? { ...n, isRead: true } : n) : { ...n, isRead: true })
        );
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "error": return <XCircle className="h-5 w-5 text-red-500" />;
            case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            default: return <Info className="h-5 w-5 text-brand-primary" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "billing": return <CreditCard className="h-4 w-4" />;
            case "member": return <Users className="h-4 w-4" />;
            case "security": return <Shield className="h-4 w-4" />;
            default: return <Settings2 className="h-4 w-4" />;
        }
    };

    const filteredNotifications = activeTab === "all"
        ? notifications
        : activeTab === "unread"
            ? notifications.filter(n => !n.isRead)
            : notifications.filter(n => n.type === activeTab);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 pb-20 select-none" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header Area matching settings page */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 text-[15px] font-medium">
                        {t("unreadCount", { count: unreadCount })}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => markAsRead()}
                        className="rounded-2xl h-12 px-6 font-bold"
                    >
                        <CheckCheck className="w-4 h-4 me-2" />
                        {t("markAllRead")}
                    </Button>
                )}
            </div>

            <Tabs activeValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start rounded-none w-full border-b border-gray-100 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {[
                        { id: "all", label: t("types.all"), icon: Bell },
                        { id: "unread", label: t("types.unread"), icon: Info },
                        { id: "billing", label: t("types.billing"), icon: CreditCard },
                        { id: "member", label: t("types.member"), icon: Users },
                        { id: "security", label: t("types.security"), icon: Shield },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                activeValue={activeTab}
                                onValueChange={setActiveTab}
                                className={cn(
                                    "relative px-0 py-4 h-full bg-transparent border-none rounded-none text-[15px] font-bold transition-all shadow-none",
                                    isActive ? "text-brand-primary" : "text-gray-400 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", isActive ? "text-brand-primary" : "text-gray-300")} />
                                    {tab.label}
                                    {tab.id === "unread" && unreadCount > 0 && (
                                        <span className={cn(
                                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black",
                                            isActive ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full"
                                    />
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                <TabsContent value={activeTab} activeValue={activeTab} className="mt-0 outline-none">
                    <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-20 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mb-6">
                                    <Inbox className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-1">
                                    {t("noNotifications")}
                                </h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    {t("allCaughtUp")}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredNotifications.map((n, index) => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-all group",
                                            !n.isRead && "bg-brand-primary/5"
                                        )}
                                        onClick={() => !n.isRead && markAsRead(n.id)}
                                    >
                                        <div className="w-12 h-12 rounded-[18px] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                            {getSeverityIcon(n.severity)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <h4 className={cn(
                                                    "text-lg font-black truncate",
                                                    n.isRead ? "text-gray-700" : "text-gray-900"
                                                )}>
                                                    {n.title === "Seat Limit Reached" ? t("alerts.seatLimit") :
                                                        n.title === "Storage Limit Reached" ? t("alerts.storageLimit") :
                                                            n.title === "Payment Failed" ? t("alerts.paymentFailed") :
                                                                n.title}
                                                </h4>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(n.createdAt).toLocaleDateString(locale, {
                                                            day: "numeric",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </span>
                                                    {!n.isRead && (
                                                        <div className="w-2 h-2 bg-brand-primary rounded-full" />
                                                    )}
                                                </div>
                                            </div>

                                            {n.message && (
                                                <p className={cn(
                                                    "text-[15px] font-medium leading-relaxed max-w-3xl",
                                                    n.isRead ? "text-gray-400" : "text-gray-600"
                                                )}>
                                                    {n.message}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                    {getTypeIcon(n.type)}
                                                    {t(`types.${n.type}`)}
                                                </div>

                                                {n.linkUrl && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); router.push(n.linkUrl!); }}
                                                        className="h-8 px-4 rounded-xl text-xs font-bold border-slate-200"
                                                    >
                                                        {t("viewDetails")}
                                                        <ExternalLink className="w-3 h-3 ms-2" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
