"use client";

import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function FloatingHeader() {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const params = useParams();
    const locale = (params?.locale as string) || "en";

    const getPageTitle = () => {
        const path = pathname.split('/').pop();
        if (!path || path === locale || path === 'dashboard') return t("items.dashboard");
        const keyMap: Record<string, string> = {
            'cases': 'cases',
            'clients': 'clients',
            'general-work': 'generalWork',
            'calendar': 'calendar',
            'documents': 'documents',
            'reminders': 'reminders',
            'draft-assistant': 'draftAssistant',
            'team': 'team',
            'settings': 'settings',
            'subscription': 'subscription',
            'profile': 'profile'
        };
        const key = keyMap[path];
        return key ? t(`items.${key}`) : path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
        </div>
    );
}
