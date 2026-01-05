"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    ClipboardList, Users, DollarSign, Calendar, Save, X, Zap,
    ArrowLeft, ArrowRight, CheckCircle2, Info, Lock,
    ChevronRight, ChevronLeft, Plus, Trash2, CreditCard,
    FileText, AlertCircle, Briefcase, Clock, ShieldCheck
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Stepper from "@/components/ui/Stepper";
import { cn } from "@/lib/utils";

interface AddWorkWizardProps {
    onClose?: () => void;
}

interface Client {
    id: string;
    name: string;
    clientNumber: string;
}

export default function AddWorkWizard({ onClose }: AddWorkWizardProps) {
    const t = useTranslations("generalWork");
    const tCommon = useTranslations("common");
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "en";
    const isRtl = locale === "ar";

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);

    const [formData, setFormData] = useState({
        clientId: "",
        title: "",
        description: "",
        workType: "consultation",
        status: "pending",
        priority: "medium",
        fee: "",
        paid: "",
        paymentStatus: "unpaid",
        startDate: "",
        dueDate: "",
        completionDate: "",
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch("/api/clients?pageSize=1000");
            if (response.ok) {
                const data = await response.json();
                setClients(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(v => v + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(v => v - 1);
    };

    const handleSubmit = async () => {
        if (!formData.clientId.trim() || !formData.title.trim()) {
            setCurrentStep(0);
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                fee: formData.fee ? parseFloat(formData.fee) : undefined,
                paid: formData.paid ? parseFloat(formData.paid) : undefined,
                startDate: formData.startDate || undefined,
                dueDate: formData.dueDate || undefined,
                completionDate: formData.completionDate || undefined,
            };

            const response = await fetch("/api/general-work", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                if (onClose) {
                    onClose();
                } else {
                    router.push(`/${locale}/dashboard/general-work`);
                }
                router.refresh();
            }
        } catch (error) {
            console.error("Error creating work:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { title: t("wizard.step1"), icon: ClipboardList },
        { title: t("wizard.step2"), icon: Users },
        { title: t("wizard.step3"), icon: Calendar },
        { title: t("wizard.step4"), icon: CheckCircle2 },
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.workInformation")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("enterWorkDetails")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("workType")} *</Label>
                                <Select
                                    value={formData.workType}
                                    onChange={(v) => setFormData(prev => ({ ...prev, workType: v }))}
                                    options={Object.keys(t.raw("workTypes")).map(key => ({ value: key, label: t(`workTypes.${key}`) }))}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("workTitle")} *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={isRtl ? "مثال: استشارة قانونية..." : "e.g. Legal Consultation..."}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{tCommon("description")}</Label>
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

            case 1:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.clientAndDetails")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("selectClient")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("selectClient")} *</Label>
                                <Select
                                    value={formData.clientId}
                                    onChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))}
                                    options={[
                                        { value: "", label: t("selectClient") },
                                        ...clients.map(client => ({
                                            value: client.id,
                                            label: `${client.name} (${client.clientNumber})`
                                        }))
                                    ]}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("status")}</Label>
                                <Select
                                    value={formData.status}
                                    onChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                                    options={Object.keys(t.raw("statuses")).map(key => ({ value: key, label: t(`statuses.${key}`) }))}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
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
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.financialsAndDates")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("financialInfo")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("fee")}</Label>
                                <Input
                                    id="fee"
                                    name="fee"
                                    type="number"
                                    value={formData.fee}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("paidAmount")}</Label>
                                <Input
                                    id="paid"
                                    name="paid"
                                    type="number"
                                    value={formData.paid}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("startDate")}</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("dueDate")}</Label>
                                <Input
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("wizard.reviewAndSave")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{tCommon("confirm")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />

                            <div className="relative z-10 flex flex-col gap-8">
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">{tCommon("confirm")}</h3>
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1.5 leading-none">{isRtl ? "يرجى مراجعة كافة البيانات قبل الحفظ" : "Review all details before saving"}</p>
                                        </div>
                                    </div>
                                    <Zap className="w-4 h-4 text-brand-primary fill-brand-primary/20" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <ClipboardList className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("workInfo")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{formData.title || "-"}</p>
                                            <p className="text-[10px] text-white/50">{t(`workTypes.${formData.workType}`)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("selectClient")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{clients.find(c => c.id === formData.clientId)?.name || "-"}</p>
                                            <p className="text-[10px] text-white/50">{t(`priorities.${formData.priority}`)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("financialInfo")}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-brand-primary">{formData.fee ? parseFloat(formData.fee).toLocaleString() : "0"}</p>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{t(`paymentStatuses.${formData.paymentStatus}`)}</p>
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

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase">{t("wizard.createNewWork")}</h1>
                    <p className="text-gray-400 text-xs font-medium">{t("wizard.enterWorkDetails")}</p>
                </div>
                <button
                    onClick={onClose || (() => router.back())}
                    className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="mb-10">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-[0_45px_100px_rgba(0,0,0,0.02)] border border-[#F1F5F9] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute -top-[5%] -right-[5%] w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 min-h-[400px]">
                    {isLoadingData ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                {isRtl ? "جاري التحميل..." : "Loading wizard..."}
                            </p>
                        </div>
                    ) : (
                        renderStepContent()
                    )}
                </div>

                {!isLoadingData && (
                    <div className="mt-16 pt-8 border-t border-gray-50 flex items-center justify-between relative z-10">
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
                                    <span className="text-sm uppercase">{t("wizard.finish")}</span>
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
                )}
            </div>
        </div>
    );
}
