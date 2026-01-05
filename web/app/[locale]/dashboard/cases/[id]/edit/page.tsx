"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    Scale, Users, Save, X, Zap,
    ChevronRight, ChevronLeft, Plus, Gavel,
    CreditCard, ShieldCheck, Lock, CheckCircle2, Trash2
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Stepper from "@/components/ui/Stepper";
import Checkbox from "@/components/ui/Checkbox";
import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

export default function EditCasePage() {
    const t = useTranslations("cases");
    const tCommon = useTranslations("common");
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "ar";
    const id = params?.id as string;
    const isRtl = locale === "ar";

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
    const [casesList, setCasesList] = useState<Array<{ id: string; title: string; caseStage: string }>>([]);

    // Form State
    const [formData, setFormData] = useState({
        caseNumber: "",
        caseYear: new Date().getFullYear(),
        title: "",
        description: "",
        caseType: "civil",
        customCaseType: "",
        claimAmount: "",
        currency: "AED",
        priority: "medium",
        clientId: "",
        clientCapacity: "",
        opposingParty: "",
        opposingPartyCapacity: "",
        court: "",
        caseStage: "under_preparation",
        customCaseStage: "",
        filingDate: "",
        password: "",
        clientPhone: "",
        clientEmail: "",
        clientAddress: "",
        opposingPartyPhone: "",
        opposingPartyEmail: "",
        opposingPartyAddress: "",
    });

    const [linkedCaseId, setLinkedCaseId] = useState("");
    const [syncCaseStage, setSyncCaseStage] = useState(true);
    const [additionalClients, setAdditionalClients] = useState<Array<{ name: string; capacity?: string; phone?: string; email?: string; address?: string }>>([]);
    const [additionalOpposing, setAdditionalOpposing] = useState<Array<{ name: string; capacity?: string; phone?: string; email?: string; address?: string }>>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, casesRes, caseRes] = await Promise.all([
                    fetch("/api/clients?pageSize=1000"),
                    fetch("/api/cases?pageSize=1000"),
                    fetch(`/api/cases/${id}`)
                ]);

                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    setClients(Array.isArray(data?.items) ? data.items : []);
                }

                if (casesRes.ok) {
                    const data = await casesRes.json();
                    setCasesList(Array.isArray(data?.items) ? data.items.map((c: any) => ({ id: c.id, title: c.title, caseStage: c.caseStage })) : []);
                }

                if (caseRes.ok) {
                    const data = await caseRes.json();
                    setFormData({
                        caseNumber: data.caseNumber || "",
                        caseYear: data.caseYear || new Date().getFullYear(),
                        title: data.title || "",
                        description: data.description || "",
                        caseType: data.caseType || "civil",
                        customCaseType: data.customCaseType || "",
                        claimAmount: data.claimAmount?.toString() || "",
                        currency: data.currency || "AED",
                        priority: data.priority || "medium",
                        clientId: data.clientId || "",
                        clientCapacity: data.clientCapacity || "",
                        opposingParty: data.opposingParty || "",
                        opposingPartyCapacity: data.opposingPartyCapacity || "",
                        court: data.court || "",
                        caseStage: data.caseStage || "under_preparation",
                        customCaseStage: data.customCaseStage || "",
                        filingDate: data.filingDate ? new Date(data.filingDate).toISOString() : "",
                        password: "",
                        clientPhone: data.clientPhone || "",
                        clientEmail: data.clientEmail || "",
                        clientAddress: data.clientAddress || "",
                        opposingPartyPhone: data.opposingPartyPhone || "",
                        opposingPartyEmail: data.opposingPartyEmail || "",
                        opposingPartyAddress: data.opposingPartyAddress || "",
                    });
                    setLinkedCaseId(data.parentCaseId || "");
                    setAdditionalClients(data.additionalClients || []);
                    setAdditionalOpposing(data.additionalParties || []);
                }
            } catch (error) {
                console.error("Error fetching wizard data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const selectedClient = clients.find(c => c.id === formData.clientId);

            const payload = {
                ...formData,
                clientName: selectedClient?.name || "Unknown Client",
                linkedCaseId,
                syncCaseStage,
                additionalClients,
                additionalOpposingParties: additionalOpposing,
                caseYear: parseInt(formData.caseYear.toString()),
                claimAmount: formData.claimAmount ? parseFloat(formData.claimAmount) : undefined,
                filingDate: formData.filingDate && formData.filingDate.trim() !== ""
                    ? new Date(formData.filingDate).toISOString()
                    : undefined,
            };

            const response = await fetch(`/api/cases/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.push(`/${locale}/dashboard/cases/${id}`);
                router.refresh();
            }
        } catch (error) {
            console.error("Error updating case:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { title: t("wizard.step1"), icon: Scale },
        { title: t("wizard.step2"), icon: Users },
        { title: t("wizard.step3"), icon: CreditCard },
        { title: t("wizard.step4"), icon: ShieldCheck },
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.caseInformation")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("wizard.enterCaseDetails")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("caseType")} *</Label>
                                <Select
                                    value={formData.caseType}
                                    onChange={(v) => setFormData(prev => ({ ...prev, caseType: v }))}
                                    options={[
                                        ...Object.keys(t.raw("caseTypes")).map((type) => ({ value: type, label: t(`caseTypes.${type}`) }))
                                    ]}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("caseNumber")}</Label>
                                <Input
                                    id="caseNumber"
                                    name="caseNumber"
                                    value={formData.caseNumber}
                                    onChange={handleChange}
                                    placeholder="2024/..."
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("caseYear")}</Label>
                                <Input
                                    id="caseYear"
                                    name="caseYear"
                                    type="number"
                                    value={formData.caseYear}
                                    onChange={handleChange}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("linkedCase")}</Label>
                                <Select
                                    value={linkedCaseId}
                                    onChange={(v) => setLinkedCaseId(v)}
                                    options={[{ value: "", label: t("selectCase") }, ...casesList.filter(c => c.id !== id).map(c => ({ value: c.id, label: c.title }))]}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                                {linkedCaseId && (
                                    <div className="flex items-center gap-2 mt-3 px-2">
                                        <Checkbox checked={syncCaseStage} onChange={(e) => setSyncCaseStage((e.target as HTMLInputElement).checked)} />
                                        <span className="text-[12px] text-gray-400 font-black uppercase tracking-widest">{t("syncWithLinkedCase")}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {formData.caseType === "other" && (
                            <div className="space-y-3 pt-6 border-t border-gray-50">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("customCaseType")} *</Label>
                                <Input
                                    id="customCaseType"
                                    name="customCaseType"
                                    value={formData.customCaseType}
                                    onChange={handleChange}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>
                        )}
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.partiesAndAddresses")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("parties")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Client Section */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("client")} *</Label>
                                    <Select
                                        value={formData.clientId}
                                        onChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))}
                                        options={[{ value: "", label: t("selectClient") }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
                                        className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("clientCapacity")}</Label>
                                    <Input
                                        id="clientCapacity"
                                        name="clientCapacity"
                                        value={formData.clientCapacity}
                                        onChange={handleChange}
                                        placeholder={isRtl ? "مثلاً: مدعي" : "e.g. Plaintiff"}
                                        className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("phone")}</Label>
                                    <Input name="clientPhone" value={formData.clientPhone} onChange={handleChange} placeholder={t("phonePlaceholder") as string} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("email")}</Label>
                                    <Input name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} placeholder={t("emailPlaceholder") as string} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("address")}</Label>
                                <Textarea name="clientAddress" value={formData.clientAddress} onChange={handleChange} placeholder={t("addressPlaceholder") as string} className="border-gray-100 bg-gray-50/20 focus:bg-white rounded-2xl shadow-xs transition-all resize-none p-4" rows={2} />
                            </div>

                            {/* Additional Clients */}
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{t("additionalClients")}</span>
                                    <button type="button" onClick={() => setAdditionalClients(prev => [...prev, { name: "" }])} className="text-[11px] font-black text-brand-primary flex items-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> {t("addClient")}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {additionalClients.map((c, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input placeholder={t("name") as string} value={c.name} onChange={(e) => { const v = e.target.value; setAdditionalClients(prev => prev.map((pc, i) => i === idx ? { ...pc, name: v } : pc)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                                <Input placeholder={t("capacity") as string} value={c.capacity || ""} onChange={(e) => { const v = e.target.value; setAdditionalClients(prev => prev.map((pc, i) => i === idx ? { ...pc, capacity: v } : pc)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input placeholder={t("phone") as string} value={c.phone || ""} onChange={(e) => { const v = e.target.value; setAdditionalClients(prev => prev.map((pc, i) => i === idx ? { ...pc, phone: v } : pc)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                                <Input placeholder={t("email") as string} value={c.email || ""} onChange={(e) => { const v = e.target.value; setAdditionalClients(prev => prev.map((pc, i) => i === idx ? { ...pc, email: v } : pc)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input placeholder={t("address") as string} value={c.address || ""} onChange={(e) => { const v = e.target.value; setAdditionalClients(prev => prev.map((pc, i) => i === idx ? { ...pc, address: v } : pc)); }} className="h-12 border-gray-100 bg-white rounded-xl flex-1" />
                                                <button type="button" onClick={() => setAdditionalClients(prev => prev.filter((_, i) => i !== idx))} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Opposing Party Section */}
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("opposingParty")}</Label>
                                    <Input name="opposingParty" value={formData.opposingParty} onChange={handleChange} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("opposingPartyCapacity")}</Label>
                                    <Input name="opposingPartyCapacity" value={formData.opposingPartyCapacity} onChange={handleChange} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("phone")}</Label>
                                    <Input name="opposingPartyPhone" value={formData.opposingPartyPhone} onChange={handleChange} placeholder={t("phonePlaceholder") as string} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("email")}</Label>
                                    <Input name="opposingPartyEmail" type="email" value={formData.opposingPartyEmail} onChange={handleChange} placeholder={t("emailPlaceholder") as string} className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("address")}</Label>
                                <Textarea name="opposingPartyAddress" value={formData.opposingPartyAddress} onChange={handleChange} placeholder={t("addressPlaceholder") as string} className="border-gray-100 bg-gray-50/20 focus:bg-white rounded-2xl shadow-xs transition-all resize-none p-4" rows={2} />
                            </div>

                            {/* Additional Opposing Parties */}
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{t("additionalOpposingParties")}</span>
                                    <button type="button" onClick={() => setAdditionalOpposing(prev => [...prev, { name: "" }])} className="text-[11px] font-black text-brand-primary flex items-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> {t("addOpposingParty")}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {additionalOpposing.map((p, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input placeholder={t("name") as string} value={p.name} onChange={(e) => { const v = e.target.value; setAdditionalOpposing(prev => prev.map((pp, i) => i === idx ? { ...pp, name: v } : pp)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                                <Input placeholder={t("capacity") as string} value={p.capacity || ""} onChange={(e) => { const v = e.target.value; setAdditionalOpposing(prev => prev.map((pp, i) => i === idx ? { ...pp, capacity: v } : pp)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input placeholder={t("phone") as string} value={p.phone || ""} onChange={(e) => { const v = e.target.value; setAdditionalOpposing(prev => prev.map((pp, i) => i === idx ? { ...pp, phone: v } : pp)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                                <Input placeholder={t("email") as string} value={p.email || ""} onChange={(e) => { const v = e.target.value; setAdditionalOpposing(prev => prev.map((pp, i) => i === idx ? { ...pp, email: v } : pp)); }} className="h-12 border-gray-100 bg-white rounded-xl" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input placeholder={t("address") as string} value={p.address || ""} onChange={(e) => { const v = e.target.value; setAdditionalOpposing(prev => prev.map((pp, i) => i === idx ? { ...pp, address: v } : pp)); }} className="h-12 border-gray-100 bg-white rounded-xl flex-1" />
                                                <button type="button" onClick={() => setAdditionalOpposing(prev => prev.filter((_, i) => i !== idx))} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Case Title & Description */}
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("name")} *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={isRtl ? "عنوان القضية..." : "Case title..."}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("description")}</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="border-gray-100 bg-gray-50/20 focus:bg-white rounded-2xl shadow-xs transition-all resize-none p-4"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.detailsAndFinancials")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("financialInfo")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("claimAmount")}</Label>
                                <div className="relative group">
                                    <Input
                                        id="claimAmount"
                                        name="claimAmount"
                                        type="number"
                                        value={formData.claimAmount}
                                        onChange={handleChange}
                                        className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all pr-16"
                                    />
                                    <div className="absolute top-0 right-0 h-full flex items-center px-4 bg-gray-50 border-l border-gray-100 rounded-r-xl group-focus-within:bg-brand-primary/5 group-focus-within:border-brand-primary/20 transition-all">
                                        <span className="text-[11px] font-black text-gray-400 group-focus-within:text-brand-primary transition-all">{formData.currency}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("currency")}</Label>
                                <Select
                                    value={formData.currency}
                                    onChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                                    options={[
                                        { value: "SAR", label: "SAR" },
                                        { value: "AED", label: "AED" },
                                        { value: "USD", label: "USD" },
                                        { value: "EGP", label: "EGP" },
                                        { value: "KWD", label: "KWD" },
                                        { value: "QAR", label: "QAR" },
                                    ]}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("court")}</Label>
                                <Input
                                    id="court"
                                    name="court"
                                    value={formData.court}
                                    onChange={handleChange}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("priority")}</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {["low", "medium", "high", "urgent"].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, priority: level }))}
                                            className={cn(
                                                "h-12 px-2 text-[10px] font-black border transition-all rounded-xl uppercase tracking-tighter",
                                                formData.priority === level
                                                    ? level === 'low' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20 shadow-sm' :
                                                        level === 'medium' ? 'bg-orange-600/10 text-orange-600 border-orange-600/20 shadow-sm' :
                                                            'bg-red-600/10 text-red-600 border-red-600/20 shadow-sm'
                                                    : "bg-white text-gray-400 border-gray-50 hover:border-gray-100"
                                            )}
                                        >
                                            {t(`priorities.${level}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("caseStage")} *</Label>
                                <Select
                                    value={formData.caseStage}
                                    onChange={(v) => setFormData(prev => ({ ...prev, caseStage: v }))}
                                    options={Object.keys(t.raw("stages")).map((stage) => ({ value: stage, label: t(`stages.${stage}`) }))}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.securityAndReview")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("passwordProtected")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="p-8 rounded-[32px] bg-slate-50/50 border border-slate-100 space-y-8 relative overflow-hidden backdrop-blur-sm">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white rounded-xl border border-blue-50 text-blue-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{t("casePassword")}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">{t("wizard.casePasswordHelp")}</p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{isRtl ? "كلمة مرور جديدة (اختياري)" : "New Password (Optional)"}</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="h-12 border-gray-100 bg-white focus:border-brand-primary/30 rounded-xl shadow-xs transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 mx-2">{isRtl ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" : "Leave empty to keep current password"}</p>
                            </div>
                        </div>

                        {/* Review Summary Card */}
                        <div className="p-8 md:p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />

                            <div className="relative z-10 flex flex-col gap-8">
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">{isRtl ? "مراجعة التعديلات" : "Review Changes"}</h3>
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1.5 leading-none">{isRtl ? "يرجى مراجعة التغييرات قبل الحفظ" : "Review changes before saving"}</p>
                                        </div>
                                    </div>
                                    <Zap className="w-4 h-4 text-brand-primary fill-brand-primary/20" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <Scale className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("caseInformation")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{formData.title || "-"}</p>
                                            <p className="text-[10px] text-white/50">{t(`caseTypes.${formData.caseType}`)} | {formData.caseYear}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("parties")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{clients.find(c => c.id === formData.clientId)?.name || "-"}</p>
                                            <p className="text-[10px] text-white/50">{formData.opposingParty || "-"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("financialInfo")}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-brand-primary">{formData.claimAmount ? parseFloat(formData.claimAmount).toLocaleString() : "0"} {formData.currency}</p>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{t(`priorities.${formData.priority}`)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoadingData) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                    <Loader />
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        {isRtl ? "جاري التحميل..." : "Loading..."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase">{t("editCase")}</h1>
                    <p className="text-gray-400 text-xs font-medium">{t("wizard.enterCaseDetails")}</p>
                </div>
                <button
                    onClick={() => router.push(`/${locale}/dashboard/cases/${id}`)}
                    className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Stepper */}
            <div className="mb-10">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            {/* Main Form Container */}
            <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-[0_45px_100px_rgba(0,0,0,0.02)] border border-[#F1F5F9] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute -top-[5%] -right-[5%] w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10">
                    {renderStepContent()}
                </div>

                {/* Navigation Actions */}
                <div className="mt-16 pt-8 border-t border-gray-50 flex items-center justify-between relative">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 0 || isLoading}
                        className={cn(
                            "h-12 px-6 rounded-xl font-black text-gray-400 hover:text-gray-900 hover:bg-slate-50 transition-all flex items-center gap-2",
                            currentStep === 0 ? "opacity-0 pointer-events-none" : ""
                        )}
                    >
                        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        <span className="text-xs uppercase tracking-tight">{t("wizard.prevStep")}</span>
                    </Button>

                    <div className="flex items-center gap-4">
                        {currentStep === steps.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                loading={isLoading}
                                className="h-14 px-12 rounded-2xl bg-brand-primary text-white font-black shadow-[0_20px_40px_rgba(12,107,231,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                            >
                                <Save className="w-4 h-4" />
                                <span className="text-sm uppercase">{t("save")}</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                className="h-14 px-12 rounded-2xl bg-brand-primary text-white font-black shadow-[0_20px_40px_rgba(12,107,231,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 group"
                            >
                                <span className="text-sm uppercase">{t("wizard.nextStep")}</span>
                                {isRtl ?
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> :
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                }
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
