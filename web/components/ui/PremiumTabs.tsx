"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PremiumTabsProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    tabs: {
        value: string;
        label: string;
        icon?: React.ReactNode;
    }[];
    className?: string;
}

export function PremiumTabs({ activeTab, onTabChange, tabs, className }: PremiumTabsProps) {
    return (
        <div className={cn("w-full overflow-x-auto no-scrollbar", className)}>
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-[20px] border border-gray-100/50 min-w-max">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-300 relative group",
                                isActive
                                    ? "bg-white text-brand-primary"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                            )}
                        >
                            {tab.icon && (
                                <span className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-brand-primary" : "text-gray-400 group-hover:text-gray-500"
                                )}>
                                    {tab.icon}
                                </span>
                            )}
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
