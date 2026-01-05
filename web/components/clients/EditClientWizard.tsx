"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    UserPlus, ShieldCheck, FileText, Check, ChevronRight, ChevronLeft,
    Phone, Mail, MapPin, CreditCard, Upload, AlertCircle, Info,
    Briefcase, MessageSquare, Scale, PenTool, FileSearch, HelpCircle,
    Building2, Gavel, User, LayoutGrid, CheckCircle2, Save, X, Zap,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import FileUpload from "@/components/ui/FileUpload";
import Stepper from "@/components/ui/Stepper";
import AlertContainer from "@/components/ui/AlertContainer";
import { useAlert } from "@/hooks/useAlert";
import Loader from "@/components/ui/Loader";

interface EditClientWizardProps {
    onClose?: () => void;
}

export default function EditClientWizard({ onClose }: EditClientWizardProps) {
    const t = useTranslations("clients.wizard");
    const tClients = useTranslations("clients");
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "ar";
    const clientId = params?.id as string;
    const isRtl = locale === "ar";
    const { alerts, success, error, closeAlert } = useAlert();

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        clientType: "individual",
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        country: "United Arab Emirates",
        nationalId: "",
        passportNumber: "",
        tradeLicenseNumber: "",
        taxNumber: "",
        verificationStatus: "pending",
        riskLevel: "low",
        kycNotes: "",
        specialNotes: "",
        workType: "caseWork",
    });

    // Files state
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        registrationDocument: null,
        authorizationLetter: null,
        representativeId: null,
        representativeProofOfAddress: null,
        powerOfAttorneyDocument: null,
        kycFormDocument: null,
    });

    useEffect(() => {
        if (clientId) {
            fetchClientData();
        }
    }, [clientId]);

    const fetchClientData = async () => {
        setIsFetching(true);
        try {
            const response = await fetch(`/api/clients/${clientId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    clientType: data.clientType || "individual",
                    name: data.name || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    address: data.address || "",
                    city: data.city || "",
                    country: data.country || "United Arab Emirates",
                    nationalId: data.nationalId || "",
                    passportNumber: data.passportNumber || "",
                    tradeLicenseNumber: data.tradeLicenseNumber || "",
                    taxNumber: data.taxNumber || "",
                    verificationStatus: data.verificationStatus || "pending",
                    riskLevel: data.riskLevel || "low",
                    kycNotes: data.kycNotes || "",
                    specialNotes: data.specialNotes || "",
                    workType: data.workType || "caseWork",
                });
            } else {
                error(tClients("clientNotFound"));
            }
        } catch (err) {
            console.error("Error fetching client:", err);
            error(tClients("error"));
        } finally {
            setIsFetching(false);
        }
    };

    const steps = [
        { title: t("step1"), icon: UserPlus },
        { title: t("step2"), icon: ShieldCheck },
        { title: t("step3"), icon: FileText },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (key: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }));
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
            // 1. Update the client
            const clientResponse = await fetch(`/api/clients/${clientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    clientType: formData.clientType,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    nationalId: formData.nationalId,
                    passportNumber: formData.passportNumber,
                    tradeLicenseNumber: formData.tradeLicenseNumber,
                    taxNumber: formData.taxNumber,
                    verificationStatus: formData.verificationStatus,
                    riskLevel: formData.riskLevel,
                    kycNotes: formData.kycNotes,
                    specialNotes: formData.specialNotes,
                }),
            });

            if (!clientResponse.ok) {
                const errorData = await clientResponse.json();
                throw new Error(errorData.error || "Failed to update client");
            }

            // 2. Upload documents if any (simplified for now, following AddClientWizard pattern)
            const uploadPromises = Object.entries(files)
                .filter(([_, file]) => !!file)
                .map(([key, file]) => {
                    const docFormData = new FormData();
                    docFormData.append("file", file as File);
                    docFormData.append("clientId", clientId);
                    docFormData.append("documentType", key);
                    docFormData.append("title", t(key));
                    return fetch("/api/client-documents", {
                        method: "POST",
                        body: docFormData,
                    });
                });

            if (uploadPromises.length > 0) {
                const uploadResults = await Promise.all(uploadPromises);
                const failedUploads = uploadResults.filter(r => !r.ok);
                if (failedUploads.length > 0) {
                    console.error(`${failedUploads.length} documents failed to upload`);
                }
            }

            // 3. Success notification
            success(tClients("updateSuccess"));

            // 4. Redirect on success
            setTimeout(() => {
                router.push(`/${locale}/dashboard/clients/${clientId}`);
                router.refresh();
            }, 1500);
        } catch (err: any) {
            console.error("Error updating client data:", err);
            error(err.message || tClients("updateError"));
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight">{t("basicInformation")}</h2>
                                    <p className="text-gray-400 text-xs font-medium">{t("enterClientBasicInfo")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Client Type Selector - Compact Selector */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: "individual", icon: User },
                                { id: "company", icon: Building2 },
                                { id: "government", icon: Gavel },
                                { id: "organization", icon: LayoutGrid },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, clientType: type.id }))}
                                    className={cn(
                                        "p-4 rounded-[18px] border-2 transition-all flex flex-col items-center gap-2 relative overflow-hidden group",
                                        formData.clientType === type.id
                                            ? "border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm"
                                            : "border-gray-50 bg-white text-gray-400 hover:border-gray-100"
                                    )}
                                >
                                    <type.icon className={cn("w-5 h-5", formData.clientType === type.id ? "text-brand-primary" : "text-gray-300")} />
                                    <span className="text-[11px] font-black uppercase tracking-wider">{t(type.id)}</span>
                                    {formData.clientType === type.id && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Basic Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">
                                    {formData.clientType === 'individual' ? t("fullName") : t("organizationName")} *
                                </Label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={formData.clientType === 'individual' ? "John Doe" : "Organization Name"}
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all text-gray-900"
                                />
                            </div>

                            <div>
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mx-2 mb-2">
                                    {t("phone")} *
                                </Label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+971 50 123 4567"
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>

                            <div>
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mx-2 mb-2">
                                    {t("email")}
                                </Label>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="client@example.com"
                                    className="h-12 border-gray-100 bg-gray-50/20 focus:bg-white rounded-xl shadow-xs transition-all"
                                />
                            </div>
                        </div>

                        {/* Address Information Section */}
                        <div className="pt-10 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-gray-900 mb-8">
                                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-tight">{t("addressInformation")}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("address")}</Label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="123 Main Street"
                                        className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("city")}</Label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Dubai"
                                        className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("country")}</Label>
                                    <Input
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="UAE"
                                        className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Identification Details - Only for Individuals and Companies */}
                        {(formData.clientType === 'individual' || formData.clientType === 'company') && (
                            <div className="pt-10 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-gray-900 mb-8">
                                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-gray-400">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">{t("identificationNumbers")}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.clientType === 'individual' ? (
                                        <>
                                            <div>
                                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("nationalId")}</Label>
                                                <Input
                                                    name="nationalId"
                                                    value={formData.nationalId}
                                                    onChange={handleChange}
                                                    placeholder="784-1234-1234567-1"
                                                    className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("passportNumber")}</Label>
                                                <Input
                                                    name="passportNumber"
                                                    value={formData.passportNumber}
                                                    onChange={handleChange}
                                                    placeholder="A12345678"
                                                    className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("tradeLicenseNumber")}</Label>
                                                <Input
                                                    name="tradeLicenseNumber"
                                                    value={formData.tradeLicenseNumber}
                                                    onChange={handleChange}
                                                    placeholder="CN-1234567"
                                                    className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("taxNumber")}</Label>
                                                <Input
                                                    name="taxNumber"
                                                    value={formData.taxNumber}
                                                    onChange={handleChange}
                                                    placeholder="10012345678"
                                                    className="h-12 border-gray-100 bg-gray-50/20 rounded-xl"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Header Section */}
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">{t("requiredDocuments")}</h2>
                                <p className="text-gray-400 text-xs font-medium">{t("uploadDocumentsForVerification")}</p>
                            </div>
                        </div>

                        {/* Professional Info Callouts - Compact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(formData.clientType === 'company' || formData.clientType === 'organization') && (
                                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                        <Building2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-indigo-900">{t("requiredForOrganizations")}</h4>
                                        <p className="text-[10px] text-indigo-600/70 leading-tight mt-0.5">{t("organizationDocRequirements")}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Document Grid - Compact */}
                        <div className="grid grid-cols-1 gap-12">
                            {[
                                { id: "registrationDocument", label: t("registrationDocument") },
                                { id: "authorizationLetter", label: t("authorizationLetter") },
                                { id: "representativeId", label: t("representativeId") },
                                { id: "representativeProofOfAddress", label: t("representativeProofOfAddress") },
                                { id: "powerOfAttorneyDocument", label: t("powerOfAttorneyDocument") },
                                { id: "kycFormDocument", label: t("kycFormDocument") }
                            ].map((doc) => (
                                <div key={doc.id} className="space-y-3">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-[0.15em] mx-3 mb-1">{doc.label}</Label>
                                    <FileUpload
                                        file={files[doc.id]}
                                        onChange={(f) => handleFileChange(doc.id, f)}
                                        className="h-24 border-gray-100 bg-gray-50/20 hover:bg-white hover:border-brand-primary/30 transition-all rounded-2xl p-2"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* KYC & Verification Section - Clean Card */}
                        <div className="mt-12 p-6 md:p-8 rounded-[32px] bg-slate-50/50 border border-slate-100 space-y-10 relative overflow-hidden backdrop-blur-sm">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white rounded-xl border border-emerald-50 text-emerald-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{t("kycVerification")}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">{t("kycVerificationDescription")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 relative z-20">
                                <div>
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-[0.15em] mx-2 mb-2">{t("verificationStatus")}</Label>
                                    <Select
                                        value={formData.verificationStatus}
                                        onChange={(v) => setFormData(p => ({ ...p, verificationStatus: v }))}
                                        options={[
                                            { value: "pending", label: t("statusPending") },
                                            { value: "verified", label: t("statusVerified") },
                                            { value: "rejected", label: t("statusRejected") },
                                            { value: "in_review", label: t("statusInReview") },
                                        ]}
                                        className="h-11 border-gray-100 rounded-xl bg-white"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-[0.15em] mx-2 mb-2">{t("riskLevel")}</Label>
                                    <Select
                                        value={formData.riskLevel}
                                        onChange={(v) => setFormData(p => ({ ...p, riskLevel: v }))}
                                        options={[
                                            { value: "low", label: t("lowRisk") },
                                            { value: "medium", label: t("mediumRisk") },
                                            { value: "high", label: t("highRisk") },
                                        ]}
                                        className="h-11 border-gray-100 rounded-xl bg-white"
                                    />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-[0.15em] mx-2 mb-2">{t("kycNotes")}</Label>
                                <Textarea
                                    name="kycNotes"
                                    value={formData.kycNotes}
                                    onChange={handleChange}
                                    placeholder={t("kycNotesPlaceholder")}
                                    className="border-gray-100 rounded-2xl !bg-white p-4 min-h-[80px] text-[12px]"
                                />
                            </div>

                            {/* Compact Status Indicator */}
                            <div className="pt-8 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-4 relative z-10">
                                {Object.entries(files).map(([key, file]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            file ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" : "bg-gray-200"
                                        )} />
                                        <span className={cn(
                                            "text-[12px] font-black uppercase tracking-widest",
                                            file ? "text-emerald-600" : "text-gray-400"
                                        )}>
                                            {t(key)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Split Layout for Notes and Assignment - Compact */}
                        <div className="grid grid-cols-1 gap-8">
                            {/* Notes Card */}
                            <div className="p-8 rounded-[32px] bg-white space-y-8 relative overflow-hidden group">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 leading-tight uppercase tracking-tight">{t("notesAndInstructions")}</h3>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">{t("addSpecialNotes")}</p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <Label className="block text-[14px] font-black text-gray-500 uppercase tracking-widest mx-2 mb-2">{t("specialNotes")}</Label>
                                    <Textarea
                                        name="specialNotes"
                                        value={formData.specialNotes}
                                        onChange={handleChange}
                                        placeholder={t("specialNotesPlaceholder")}
                                        className="h-[140px] border-gray-100 bg-gray-50/20 rounded-2xl p-4 text-gray-900 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Work Type Selection - Compact Grid */}
                            <div className="p-8 rounded-[32px] bg-white space-y-8 relative overflow-hidden group">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 leading-tight uppercase tracking-tight">{t("workAssignment")}</h3>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">{t("assignWorkDesc")}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    {[
                                        { id: "caseWork", icon: Scale, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                                        { id: "consultation", icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                                        { id: "contractDraft", icon: PenTool, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                                        { id: "contractReview", icon: FileSearch, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
                                        { id: "legalNotice", icon: Briefcase, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                                        { id: "legalOpinion", icon: Scale, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
                                        { id: "otherWork", icon: LayoutGrid, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, workType: type.id }))}
                                            className={cn(
                                                "p-4 rounded-xl border-1 transition-all flex items-center gap-2",
                                                formData.workType === type.id
                                                    ? cn(type.bg, type.border, type.color)
                                                    : "border-gray-50 bg-gray-50/20 text-gray-400 hover:border-gray-100"
                                            )}
                                        >
                                            <type.icon className={cn("w-4 h-4", formData.workType === type.id ? type.color : "text-gray-300")} />
                                            <span className="text-[12px] font-black uppercase tracking-tight truncate">{t(type.id)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Review Summary Card - High Contrast Compact */}
                        <div className="mt-12 p-8 md:p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />

                            <div className="relative z-10 flex flex-col gap-8">
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">{t("reviewSummary")}</h3>
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1.5 leading-none">{t("reviewBeforeSubmit")}</p>
                                        </div>
                                    </div>
                                    <Zap className="w-4 h-4 text-brand-primary fill-brand-primary/20" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("basicInformation")}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate">{formData.name || "-"}</p>
                                            <p className="text-[10px] text-white/50">{formData.phone || "-"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("kycStatus")}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#5E36FF]">{formData.verificationStatus}</p>
                                                <p className="text-[9px] text-white/40">{formData.riskLevel.toUpperCase()}</p>
                                            </div>
                                            <div className="w-[1px] h-6 bg-white/10" />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-white">{Object.values(files).filter(f => !!f).length}</p>
                                                <p className="text-[9px] text-white/40 uppercase">FILES</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white/30">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("workAssignment")}</span>
                                        </div>
                                        <div className="p-2 px-4 rounded-xl bg-white/5 border border-white/10 inline-block">
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{t(formData.workType)}</p>
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
            <AlertContainer alerts={alerts} onClose={closeAlert} />
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase">{tClients("editClient")}</h1>
                </div>
                <button
                    onClick={onClose || (() => router.back())}
                    className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Stepper - Consistent Top Navigation */}
            <div className="mb-10">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            {/* Main Premium Form Container - Compact Padding */}
            <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-[0_45px_100px_rgba(0,0,0,0.02)] border border-[#F1F5F9] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute -top-[5%] -right-[5%] w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 min-h-[400px]">
                    {renderStepContent()}
                </div>

                {/* Navigation Actions - Compact Spacing */}
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
                        <span className="text-xs uppercase tracking-tight">{t("prevStep")}</span>
                    </Button>

                    <div className="flex items-center gap-4">
                        {currentStep === steps.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                loading={isLoading}
                                className="h-14 px-12 rounded-2xl bg-brand-primary text-white font-black shadow-[0_20px_40px_rgba(12,107,231,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                            >
                                <Save className="w-4 h-4" />
                                <span className="text-sm uppercase tracking-widest">{t("saveChanges")}</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                className="h-14 px-12 rounded-2xl bg-brand-primary text-white font-black shadow-[0_20px_40px_rgba(12,107,231,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 group"
                            >
                                <span className="text-sm uppercase tracking-widest">{t("nextStep")}</span>
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
