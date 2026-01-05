"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ClipboardList, DollarSign, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import AlertModal from "@/components/ui/AlertModal";
import ExpandableSection from "@/components/ui/ExpandableSection";
import Loader from "@/components/ui/Loader";

type WorkItem = {
    id: string;
    title: string;
    description: string | null;
    workType: string;
    status: string;
    priority: string;
    fee: number | null;
    paid: number | null;
    paymentStatus: string;
    startDate: string | null;
    completionDate: string | null;
    dueDate: string | null;
    clientId: string;
};

export default function EditGeneralWorkPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const resolvedParams = use(params);
    const t = useTranslations("generalWork");
    const tCommon = useTranslations("common");
    const routeParams = useParams();
    const router = useRouter();
    const locale = (routeParams?.locale as string) || "en";

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
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

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        fetchWork();
    }, [resolvedParams.id]);

    const fetchWork = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/general-work/${resolvedParams.id}`);
            if (response.ok) {
                const data: WorkItem = await response.json();
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    workType: data.workType || "consultation",
                    status: data.status || "pending",
                    priority: data.priority || "medium",
                    fee: data.fee ? String(data.fee / 1000) : "",
                    paid: data.paid ? String(data.paid / 1000) : "",
                    paymentStatus: data.paymentStatus || "unpaid",
                    startDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "",
                    completionDate: data.completionDate ? new Date(data.completionDate).toISOString().split("T")[0] : "",
                });
            }
        } catch (error) {
            console.error("Error fetching work:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setAlertMessage(t("workTitle") + " " + tCommon("required"));
            setAlertOpen(true);
            return;
        }
        setIsSaving(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description || null,
                status: formData.status,
                priority: formData.priority,
                fee: formData.fee ? parseFloat(formData.fee) : undefined,
                paid: formData.paid ? parseFloat(formData.paid) : undefined,
                paymentStatus: formData.paymentStatus,
                startDate: formData.startDate || undefined,
                dueDate: formData.dueDate || undefined,
                completionDate: formData.completionDate || undefined,
            };

            const response = await fetch(`/api/general-work/${resolvedParams.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.push(`/${locale}/dashboard/general-work/${resolvedParams.id}`);
                router.refresh();
            } else {
                const error = await response.json();
                setAlertMessage(error.error || "Failed to update work");
                setAlertOpen(true);
            }
        } catch (error) {
            console.error("Error updating work:", error);
            setAlertMessage("An error occurred");
            setAlertOpen(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] overflow-hidden">
                <Loader className="py-24" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[800px] mx-auto py-6">
            {/* Header */}
            <div>
                <Link
                    href={`/${locale}/dashboard/general-work/${resolvedParams.id}`}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("backToWork")}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{t("editWork")}</h1>
                <p className="text-gray-600 mt-1">{t("updateWorkInfo")}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Work Information */}
                <ExpandableSection title={t("workInfo")} defaultExpanded icon={<ClipboardList className="h-5 w-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label className="mx-2" htmlFor="title">{t("workTitle")} *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="mt-3"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label className="mx-2" htmlFor="description">{tCommon("description")}</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="status">{t("status")}</Label>
                            <Select
                                value={formData.status}
                                onChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                                options={[
                                    { value: "pending", label: t("statuses.pending") },
                                    { value: "in_progress", label: t("statuses.in_progress") },
                                    { value: "completed", label: t("statuses.completed") },
                                    { value: "cancelled", label: t("statuses.cancelled") },
                                ]}
                                className="w-full mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="priority">{t("priority")}</Label>
                            <Select
                                value={formData.priority}
                                onChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                                options={[
                                    { value: "low", label: t("priorities.low") },
                                    { value: "medium", label: t("priorities.medium") },
                                    { value: "high", label: t("priorities.high") },
                                    { value: "urgent", label: t("priorities.urgent") },
                                ]}
                                className="w-full mt-3"
                            />
                        </div>
                    </div>
                </ExpandableSection>

                {/* Dates */}
                <ExpandableSection title={locale === "ar" ? "التواريخ" : "Dates"} icon={<Calendar className="h-5 w-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="startDate">{t("startDate")}</Label>
                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="dueDate">{t("dueDate")}</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="completionDate">{t("completionDate")}</Label>
                            <Input
                                id="completionDate"
                                name="completionDate"
                                type="date"
                                value={formData.completionDate}
                                onChange={handleChange}
                                className="mt-3"
                            />
                        </div>
                    </div>
                </ExpandableSection>

                {/* Financial Information */}
                <ExpandableSection title={t("financialInfo")} icon={<DollarSign className="h-5 w-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="fee">{t("fee")}</Label>
                            <Input
                                id="fee"
                                name="fee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.fee}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="paid">{t("paidAmount")}</Label>
                            <Input
                                id="paid"
                                name="paid"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.paid}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="mt-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="mx-2" htmlFor="paymentStatus">{t("paymentStatus")}</Label>
                            <Select
                                value={formData.paymentStatus}
                                onChange={(v) => setFormData(prev => ({ ...prev, paymentStatus: v }))}
                                options={[
                                    { value: "unpaid", label: t("paymentStatuses.unpaid") },
                                    { value: "partial", label: t("paymentStatuses.partial") },
                                    { value: "paid", label: t("paymentStatuses.paid") },
                                ]}
                                className="w-full mt-3"
                            />
                        </div>
                    </div>
                </ExpandableSection>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6">
                    <Link href={`/${locale}/dashboard/general-work/${resolvedParams.id}`}>
                        <Button
                            type="button"
                            variant="outline"
                            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-gray-700 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                        >
                            <span className="relative z-10">{tCommon("cancel")}</span>
                            <span className="absolute inset-0 z-0 scale-x-0 rounded-2xl bg-linear-to-r from-gray-50 to-gray-100 transition-transform duration-300 group-hover:scale-x-100" />
                        </Button>
                    </Link>

                    <Button
                        type="submit"
                        loading={isSaving}
                        className="group relative overflow-hidden rounded-2xl bg-brand-primary px-6 py-2.5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span className="absolute inset-0 z-0 scale-0 rounded-2xl bg-linear-to-r from-brand-primary to-brand-secondary transition-transform duration-300 group-hover:scale-100" />
                        <span className="relative z-10 flex items-center gap-2">
                            <Save className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                            {tCommon("save")}
                        </span>
                    </Button>
                </div>
            </form>
            <AlertModal isOpen={alertOpen} type="error" message={alertMessage} onClose={() => setAlertOpen(false)} />
        </div>
    );
}
