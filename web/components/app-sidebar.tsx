/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Home,
    Briefcase,
    Users,
    FileText,
    Calendar,
    CalendarDays,
    CalendarFold,
    FolderOpen,
    Bell,
    FileEdit,
    UsersRound,
    BellRing,
    CreditCard,
    LogOut,
    Menu,
    X,
    User,
    Languages,
    BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
    {
        title: "main",
        items: [
            { name: "dashboard", href: "/dashboard", icon: Home },
            { name: "cases", href: "/dashboard/cases", icon: Briefcase },
            { name: "clients", href: "/dashboard/clients", icon: Users },
            { name: "generalWork", href: "/dashboard/general-work", icon: FileText },
        ],
    },
    {
        title: "tools",
        items: [
            { name: "myCalendar", href: "/dashboard/calendar", icon: Calendar },
            { name: "firmCalendar", href: "/dashboard/calendar/firm", icon: CalendarFold },
            { name: "hearings", href: "/dashboard/hearings", icon: CalendarDays },
            { name: "documents", href: "/dashboard/documents", icon: FolderOpen },
            { name: "reminders", href: "/dashboard/reminders", icon: Bell },
            { name: "draftAssistant", href: "/dashboard/drafting", icon: FileEdit },
        ],
    },
    {
        title: "management",
        items: [
            { name: "team", href: "/dashboard/team", icon: UsersRound },
            { name: "firmSettings", href: "/dashboard/firm/settings", icon: Briefcase },
            { name: "notifications", href: "/dashboard/firm/notifications", icon: BellRing },
            { name: "billing", href: "/dashboard/subscription", icon: CreditCard },
            { name: "reports", href: "/dashboard/reports", icon: BarChart3 },
        ],
    },
];

export function AppSidebar() {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const { isCollapsed, toggle } = useSidebar();

    const isRTL = locale === "ar";
    const otherLocale = locale === "en" ? "ar" : "en";
    const currentPath = pathname.replace(`/${locale}`, "");

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-4 z-50 md:hidden p-2 rounded-xl bg-white shadow-lg border border-gray-100 ${isRTL ? "right-4" : "left-4"
                    }`}
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
          fixed top-0 bottom-0 z-50 backdrop-blur-xl transition-all duration-300
          rounded-none md:rounded-none shadow-sm h-screen bg-brand-secondary
          ${isRTL ? "right-0" : "left-0"}
          ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "w-[80px]" : "w-[300px]"}
        `}
            >
                <div className="flex flex-col h-full gap-3">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6">
                        {!isCollapsed && (
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="logo" className="w-16 logo-white" />
                            </div>
                        )}
                        <button
                            onClick={toggle}
                            className={`hidden md:flex items-center justify-center h-8 w-8 hover:bg-white/10 rounded-lg transition-colors ${isCollapsed ? "mx-auto" : ""}`}
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="h-4 w-4 text-white/60" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
                        {navigation.map((section) => (
                            <div key={section.title}>
                                {!isCollapsed && (
                                    <div className="px-2 mb-2 text-xs font-bold text-white uppercase tracking-wider">
                                        {t(`sections.${section.title}`)}
                                    </div>
                                )}
                                <ul className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === `/${locale}${item.href}`;
                                        const Icon = item.icon;
                                        const displayLabel = t(`items.${item.name}`);

                                        return (
                                            <li key={`${section.title}-${item.name}-${item.href}`}>
                                                <Link
                                                    href={`/${locale}${item.href}`}
                                                    className={`
                                                        flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                                        ${isActive
                                                            ? "text-brand-primary"
                                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                                        }
                                                        ${isCollapsed ? "justify-center px-0" : ""}
                                                    `}
                                                    title={isCollapsed ? displayLabel : undefined}
                                                >
                                                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} />
                                                    {!isCollapsed && <span className={`${isActive ? "glow-text font-bold" : ""}`}>{displayLabel}</span>}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}

                        {/* General Section */}
                        <div>
                            {!isCollapsed && (
                                <div className="px-2 mb-2 text-xs font-bold text-white uppercase tracking-wider">
                                    {t("sections.general")}
                                </div>
                            )}
                            <ul className="space-y-1">
                                {/* Profile Link */}
                                <li>
                                    <Link
                                        href={`/${locale}/profile`}
                                        className={`
                        flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        ${pathname === `/${locale}/profile`
                                                ? "bg-white/20"
                                                : "text-white/60 hover:bg-white/5 hover:text-white"
                                            }
                        ${isCollapsed ? "justify-center px-0" : ""}
                      `}
                                        title={isCollapsed ? t("items.profile") : undefined}
                                    >
                                        <User className={`h-4 w-4 shrink-0 ${pathname === `/${locale}/profile` ? "text-white glow-icon" : "text-white/60 group-hover:text-white"}`} />
                                        {!isCollapsed && <span className={`${pathname === `/${locale}/profile` ? "glow-text font-bold" : ""}`}>{t("items.profile")}</span>}
                                    </Link>
                                </li>

                                {/* Language Switcher (styled as nav link) */}
                                <li>
                                    <Link
                                        href={`/${otherLocale}${currentPath}`}
                                        className={`
                        flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        text-white/60 hover:bg-white/5 hover:text-white
                        ${isCollapsed ? "justify-center px-0" : ""}
                      `}
                                        title={isCollapsed ? (locale === "en" ? "العربية" : "English") : undefined}
                                    >
                                        <Languages className="h-4 w-4 shrink-0 text-white/60" />
                                        {!isCollapsed && (
                                            <span>{locale === "en" ? "العربية" : "English"}</span>
                                        )}
                                    </Link>
                                </li>

                                {/* Logout */}
                                <li>
                                    <button
                                        onClick={() => logout()}
                                        className={`
                      w-full flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300
                      ${isCollapsed ? "justify-center px-0" : ""}
                    `}
                                        title={isCollapsed ? t("logout") : undefined}
                                    >
                                        <LogOut className="h-4 w-4 shrink-0" />
                                        {!isCollapsed && <span>{t("logout")}</span>}
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {/* Bottom User Details */}
                    <div className={`p-4 mt-auto ${isCollapsed ? "flex justify-center" : ""}`}>
                        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                            <div className="relative h-8 w-8 shrink-0">
                                {user?.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt={user?.name || "User"} fill className="rounded-xl object-cover shadow-sm" />
                                ) : (
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm font-bold bg-brand-primary"
                                    >
                                        <span>{user?.name?.charAt(0).toUpperCase() || "U"}</span>
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">{user?.name}</span>
                                    <span className="text-xs text-white/60">{user?.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
