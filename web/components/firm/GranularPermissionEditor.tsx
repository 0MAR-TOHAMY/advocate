"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Select from "@/components/ui/Select";

export interface PolicyRule {
    type: "client" | "case";
    resourceId: string;
    resourceName?: string; // For display purposes
    actions: string[];
}

interface GranularPermissionEditorProps {
    firmId: string;
    value: PolicyRule[];
    onChange: (rules: PolicyRule[]) => void;
}

export function GranularPermissionEditor({ firmId, value, onChange }: GranularPermissionEditorProps) {
    const t = useTranslations("firm.roles.granular");
    const [rules, setRules] = useState<PolicyRule[]>(value || []);
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const locale = useLocale();

    useEffect(() => {
        setRules(value || []);
    }, [value]);

    useEffect(() => {
        const fetchResources = async () => {
            setLoadingResources(true);
            try {
                // Fetch clients and cases for the dropdowns
                // Ideally these should be paginated or searchable endpoints
                const [clientsRes, casesRes] = await Promise.all([
                    fetch(`/api/firms/${firmId}/clients?limit=100`),
                    fetch(`/api/firms/${firmId}/cases?limit=100`)
                ]);

                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    setClients(data.clients || []);
                }
                if (casesRes.ok) {
                    const data = await casesRes.json();
                    setCases(data.cases || []);
                }
            } catch (e) {
                console.error("Failed to fetch resources", e);
            } finally {
                setLoadingResources(false);
            }
        };
        fetchResources();
    }, [firmId]);

    const addRule = () => {
        const newRule: PolicyRule = { type: "client", resourceId: "", actions: ["view"] };
        const newRules = [...rules, newRule];
        setRules(newRules);
        onChange(newRules);
    };

    const removeRule = (index: number) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);
        onChange(newRules);
    };

    const updateRule = (index: number, updates: Partial<PolicyRule>) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], ...updates };
        setRules(newRules);
        onChange(newRules);
    };

    const toggleAction = (index: number, action: string) => {
        const rule = rules[index];
        const actions = rule.actions.includes(action)
            ? rule.actions.filter(a => a !== action)
            : [...rule.actions, action];
        updateRule(index, { actions });
    };

    const RESOURCES = [
        { value: "client", label: t("types.client") || "Client" },
        { value: "case", label: t("types.case") || "Case" },
    ];

    const ACTIONS = {
        client: [
            { value: "view", label: locale == "ar" ? "عرض" : "View" },
            { value: "edit", label: locale == "ar" ? "تعديل" : "Edit" },
            { value: "delete", label: locale == "ar" ? "حذف" : "Delete" },
            { value: "create_case", label: locale == "ar" ? "إنشاء ملف" : "Create Case" },
        ],
        case: [
            { value: "view", label: locale == "ar" ? "عرض" : "View" },
            { value: "edit", label: locale == "ar" ? "تعديل" : "Edit" },
            { value: "delete", label: locale == "ar" ? "حذف" : "Delete" },
            { value: "view_financials", label: locale == "ar" ? "الإيرادات والتكاليف" : "Financials" },
        ]
    };

    const getResourceOptions = (type: "client" | "case") => {
        const options = type === "client"
            ? clients.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
            : cases.map(c => ({ value: c.id, label: c.title }));
        return options;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
                            {t("title") || "Specific Resource Access"}
                        </h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            {t("subtitle") || "Exceptions to global policies"}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={addRule}
                    variant="ghost"
                    className="h-10 text-xs px-5 rounded-xl bg-gray-50 text-gray-600 hover:bg-brand-primary hover:text-white font-black transition-all"
                >
                    <Plus className="w-4 h-4 me-2" /> {t("addRule") || "Add Rule"}
                </Button>
            </div>

            {loadingResources ? (
                <div className="text-center py-8 text-sm text-gray-400 font-medium animate-pulse">{locale == "ar" ? "جاري تحميل الموارد..." : "Loading resources..."}</div>
            ) : rules.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="font-bold text-sm text-gray-400">{t("noRules") || "No specific access rules defined."}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="p-5 bg-gray-50 rounded-[24px] border border-transparent hover:border-gray-200 transition-all">
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{locale == "ar" ? "النوع" : "Type"}</label>
                                        <Select
                                            value={rule.type}
                                            onChange={(val) => updateRule(idx, { type: val as any, resourceId: "", actions: ["view"] })}
                                            options={RESOURCES}
                                            placeholder={locale == "ar" ? "اختر النوع" : "Select Type"}
                                            className="border-transparent h-10 min-h-[44px] text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-6 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{locale == "ar" ? "الموارد" : "Resources"}</label>
                                        <Select
                                            value={rule.resourceId}
                                            onChange={(val) => updateRule(idx, { resourceId: val })}
                                            options={getResourceOptions(rule.type)}
                                            placeholder={locale == "ar" ? "اختر المورد" : "Select Resource"}
                                            className="border-transparent h-10 min-h-[44px] text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pb-1">
                                        <div className="space-y-2 w-full flex flex-col items-center">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-0 md:opacity-100">{t("delete") || (locale == "ar" ? "حذف" : "Delete")}</label>
                                            <button
                                                onClick={() => removeRule(idx)}
                                                className="w-10 h-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title={t("delete") || "Delete Rule"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{locale == "ar" ? "الإجراءات المسموحة" : "Allowed Actions"}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ACTIONS[rule.type]?.map((action) => {
                                            const isSelected = rule.actions.includes(action.value);
                                            return (
                                                <button
                                                    key={action.value}
                                                    onClick={() => toggleAction(idx, action.value)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[12px] font-bold transition-all border",
                                                        isSelected
                                                            ? "bg-brand-primary border-brand-primary text-white"
                                                            : "bg-white border-transparent text-gray-500 hover:bg-white hover:border-gray-200"
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
