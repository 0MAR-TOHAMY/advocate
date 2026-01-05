"use client";

import { useEffect, useState } from "react";
import { Trash2, MapPin, AlignLeft, Calendar as CalendarIcon, Link2, X, ChevronDown, UserSquare2, Copy, ExternalLink, Check } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Checkbox from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import ModalButton from "../ui/ModalButton";
import AlertModal from "@/components/ui/AlertModal";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/utils";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: any) => Promise<void>;
    onDelete?: (eventId: string) => Promise<void>;
    initialData?: any;
    selectedDate?: { start: Date; end: Date; allDay: boolean } | null;
    isRTL: boolean;
    readOnly?: boolean;
    members?: { id: string; name: string }[];
    cases?: { id: string; title: string; caseNumber: string }[];
    scope?: "personal" | "firm";
}

export default function EventModal({
    isOpen, onClose, onSave, onDelete, initialData, selectedDate, isRTL, readOnly, members = [], cases = [], scope: propScope
}: EventModalProps) {
    const t = useTranslations("calendar");
    const locale = useLocale();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [eventType, setEventType] = useState("other");
    const [assignees, setAssignees] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [meetingLink, setMeetingLink] = useState("");
    const [caseId, setCaseId] = useState("");
    const [scope, setScope] = useState<"personal" | "firm">(propScope || "personal");

    useEffect(() => {
        if (propScope) setScope(propScope);
    }, [propScope]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setTitle(initialData.title);
                setDescription(initialData.extendedProps?.description || "");
                setLocation(initialData.extendedProps?.location || "");
                setEventType(initialData.extendedProps?.type || "other");

                const s = new Date(initialData.start);
                if (!isNaN(s.getTime())) {
                    s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
                    setStart(s.toISOString().slice(0, 16));
                } else {
                    setStart("");
                }

                if (initialData.end) {
                    const e = new Date(initialData.end);
                    e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
                    setEnd(e.toISOString().slice(0, 16));
                } else {
                    setEnd("");
                }
                setAllDay(initialData.allDay);
                setAssignees(initialData.extendedProps?.assignees || []);
                setMeetingLink(initialData.extendedProps?.meetingLink || "");
                setCaseId(initialData.extendedProps?.caseId || "");
                setScope(initialData.extendedProps?.scope || "personal");
            } else if (selectedDate) {
                // Create Mode
                setTitle("");
                setDescription("");
                setLocation("");
                setEventType("meeting");

                const s = new Date(selectedDate.start);
                s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
                setStart(s.toISOString().slice(0, 16));

                if (selectedDate.end) {
                    const e = new Date(selectedDate.end);
                    e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
                    setEnd(e.toISOString().slice(0, 16));
                } else {
                    setEnd("");
                }
                setAllDay(selectedDate.allDay);
                setMeetingLink("");
                setCaseId("");
                if (!propScope) setScope("personal");
            }
        }
    }, [isOpen, initialData, selectedDate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSave({
                id: initialData?.id,
                title,
                description,
                location,
                start,
                end: end || null,
                allDay,
                eventType,
                meetingLink,
                caseId,
                assignees,
                scope
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        setIsLoading(true);
        await onDelete(initialData.id);
        setIsConfirmOpen(false);
        onClose();
    };

    const hasUnsavedChanges = () => {
        if (readOnly) return false;

        const currentState = {
            title,
            description,
            location,
            start: allDay ? start.split("T")[0] : start,
            end: allDay && end ? end.split("T")[0] : end,
            allDay,
            eventType,
            assignees: [...assignees].sort()
        };

        let baseline: any = {};
        if (initialData) {
            const s = new Date(initialData.start);
            s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
            const bStart = s.toISOString().slice(0, 16);
            let bEnd = "";
            if (initialData.end) {
                const e = new Date(initialData.end);
                e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
                bEnd = e.toISOString().slice(0, 16);
            }
            baseline = {
                title: initialData.title,
                description: initialData.extendedProps?.description || "",
                location: initialData.extendedProps?.location || "",
                start: initialData.allDay ? bStart.split("T")[0] : bStart,
                end: initialData.allDay && bEnd ? bEnd.split("T")[0] : bEnd,
                allDay: initialData.allDay,
                eventType: initialData.extendedProps?.type || "other",
                meetingLink: initialData.extendedProps?.meetingLink || "",
                caseId: initialData.extendedProps?.caseId || "",
                assignees: [...(initialData.extendedProps?.assignees || [])].sort()
            };
        } else if (selectedDate) {
            const s = new Date(selectedDate.start);
            s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
            const bStart = s.toISOString().slice(0, 16);
            let bEnd = "";
            if (selectedDate.end) {
                const e = new Date(selectedDate.end);
                e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
                bEnd = e.toISOString().slice(0, 16);
            }
            baseline = {
                title: "",
                description: "",
                location: "",
                start: selectedDate.allDay ? bStart.split("T")[0] : bStart,
                end: selectedDate.allDay && bEnd ? bEnd.split("T")[0] : bEnd,
                allDay: selectedDate.allDay,
                eventType: "meeting",
                meetingLink: "",
                caseId: "",
                assignees: []
            };
        }

        return JSON.stringify(currentState) !== JSON.stringify(baseline);
    };

    const handleRequestClose = () => {
        if (hasUnsavedChanges()) {
            setIsUnsavedConfirmOpen(true);
        } else {
            onClose();
        }
    };

    const EVENT_TYPES = [
        { value: "meeting", label: t("eventTypes.meeting"), color: "bg-blue-100 text-blue-700 border-blue-200" },
        { value: "hearing", label: t("eventTypes.hearing"), color: "bg-red-100 text-red-700 border-red-200" },
        { value: "deadline", label: t("eventTypes.deadline"), color: "bg-amber-100 text-amber-700 border-amber-200" },
        { value: "consultation", label: t("eventTypes.consultation"), color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        { value: "other", label: t("eventTypes.other"), color: "bg-gray-100 text-gray-700 border-gray-200" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleRequestClose}
            title={readOnly ? t("view") : (initialData ? t("editEvent") : t("addEvent"))}
            className="p-0"
        >
            {readOnly ? (
                <div className="space-y-6 py-2">
                    {/* Header: Title & Type */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${EVENT_TYPES.find(t => t.value === eventType)?.color || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                {EVENT_TYPES.find(t => t.value === eventType)?.label}
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">
                            {title}
                        </h2>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Time */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("start")}</p>
                                <p className="text-sm font-bold text-gray-700">
                                    {new Date(start).toLocaleString(locale, {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {end && (
                                    <>
                                        <div className="w-full h-px bg-gray-200 my-2" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("end")}</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {new Date(end).toLocaleString(locale, {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Linked Case */}
                        {caseId && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary">
                                    <UserSquare2 className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("linkedCase")}</p>
                                    <p className="text-sm font-bold text-gray-700">
                                        {cases.find(c => c.id === caseId)?.title || t("noLinkedCase")}
                                        <span className="block text-[10px] text-gray-400 mt-0.5">
                                            {cases.find(c => c.id === caseId)?.caseNumber}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Location & Meeting Link Group */}
                        {(location || meetingLink) && (
                            <div className="grid grid-cols-1 gap-4">
                                {location && (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-blue-500">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("location")}</p>
                                            <p className="text-sm font-bold text-gray-700">{location}</p>
                                        </div>
                                    </div>
                                )}
                                {meetingLink && (
                                    <div className="flex flex-col p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 transition-all hover:bg-brand-primary/[0.08]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary font-black">
                                                    <Link2 className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("meetingLink")}</p>
                                                    <p className="text-sm text-gray-700 break-all leading-tighter">
                                                        {meetingLink}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(meetingLink);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    title={t("common.copy")}
                                                    className={`p-2.5 rounded-xl border transition-all ${copied
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                                        : "bg-white border-gray-100 text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 hover:shadow-sm"
                                                        }`}
                                                >
                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => window.open(meetingLink.startsWith("http") ? meetingLink : `https://${meetingLink}`, "_blank")}
                                                    title={t("joinMeeting")}
                                                    className="p-2.5 rounded-xl bg-brand-primary text-white border border-brand-primary/20 hover:bg-brand-secondary transition-all shadow-sm hover:shadow-md active:scale-95"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {description && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-amber-500">
                                    <AlignLeft className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("description")}</p>
                                    <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</p>
                                </div>
                            </div>
                        )}

                        {/* Assignees View */}
                        {(assignees.length > 0 && scope === "firm") && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-brand-primary">
                                    <UserSquare2 className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("assignedTo")}</p>
                                    <p className="text-sm font-bold text-gray-700">
                                        {assignees.includes("all")
                                            ? t("allMembers")
                                            : members.filter(m => assignees.includes(m.id)).map(m => m.name).join(", ")
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end">
                        <ModalButton type="button" variant="ghost" onClick={handleRequestClose} className="font-black text-gray-500 hover:text-gray-700 px-8 rounded-xl">
                            {t("close")}
                        </ModalButton>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3 w-full">

                    {/* Title & Linked Case */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            required
                            disabled={readOnly}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`${t("title")} ( ${t("titlePlaceholder")} )`}
                            className="h-12"
                        />
                        <Select
                            value={caseId}
                            placeholder={t("selectCase")}
                            onChange={(val) => setCaseId(val)}
                            options={[
                                { value: "", label: t("noLinkedCase") },
                                ...(cases || []).map(c => ({
                                    value: c.id,
                                    label: `${c.title} (${c.caseNumber})`
                                }))
                            ]}
                            className="w-full h-12"
                        />
                    </div>

                    {/* Location & Meeting Link */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative w-full">
                            <MapPin className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10",
                                isRTL ? "right-5" : "left-5"
                            )} />
                            <Input
                                disabled={readOnly}
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder={`${t("location")} ( ${t("locationPlaceholder")} )`}
                                className={cn("w-full flex-1", isRTL ? "pr-12" : "pl-12")}
                            />
                        </div>
                        <div className="relative w-full">
                            <Link2 className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10",
                                isRTL ? "right-5" : "left-5"
                            )} />
                            <Input
                                disabled={readOnly}
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                placeholder={`${t("meetingLink")} ( ${t("meetingLinkPlaceholder")} )`}
                                className={cn("w-full flex-1", isRTL ? "pr-12" : "pl-12")}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col items-start justify-center gap-2">
                        <Textarea
                            rows={3}
                            disabled={readOnly}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={`${t("description")} ( ${t("descriptionPlaceholder")} )`}
                            className="resize-none"
                        />
                    </div>

                    {/* Assignees Selection - Naked UI */}
                    {scope === "firm" && (
                        <div className="space-y-3">
                            {/* Badges Container */}
                            {assignees.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-1">
                                    {assignees.includes("all") ? (
                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-[11px] font-black">
                                            {t("allMembers")}
                                            <button
                                                type="button"
                                                onClick={() => setAssignees([])}
                                                className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors ml-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        members.filter(m => assignees.includes(m.id)).map(member => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/20 text-brand-primary rounded-xl text-[11px] font-bold hover:border-brand-primary/30 transition-colors"
                                            >
                                                {member.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setAssignees(prev => prev.filter(id => id !== member.id))}
                                                    className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Custom Select Box */}
                            {!assignees.includes("all") && (
                                <Select
                                    value=""
                                    placeholder={t("assignTo")}
                                    onChange={(val) => {
                                        if (val === "all") {
                                            setAssignees(["all"]);
                                        } else if (val && !assignees.includes(val)) {
                                            setAssignees(prev => [...prev, val]);
                                        }
                                    }}
                                    options={[
                                        { value: "all", label: `${t("allMembers")}` },
                                        ...members
                                            .filter(m => !assignees.includes(m.id))
                                            .map(m => ({ value: m.id, label: m.name }))
                                    ]}
                                    className="w-full h-12"
                                />
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 transition-all overflow-hidden">
                                <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors">
                                    {t("start")}
                                </label>
                                <Input
                                    type={allDay ? "date" : "datetime-local"}
                                    required
                                    disabled={readOnly}
                                    value={allDay ? start.split("T")[0] : start}
                                    onChange={e => setStart(e.target.value)}
                                    className="!bg-transparent !border-none !shadow-none !h-16 pt-8 pb-2 text-sm text-gray-700"
                                />
                            </div>
                            <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 transition-all overflow-hidden">
                                <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors">
                                    {t("end")}
                                </label>
                                <Input
                                    type={allDay ? "date" : "datetime-local"}
                                    disabled={readOnly}
                                    value={allDay && end ? end.split("T")[0] : end}
                                    onChange={e => setEnd(e.target.value)}
                                    className="!bg-transparent !border-none !shadow-none !h-16 pt-8 pb-2 text-sm text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Event Type Selection */}
                        <div className="relative group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all">
                            <label className="absolute bg-gray-100 w-full text-center border-b border-gray-200 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider group-focus-within:text-brand-primary transition-colors z-10">
                                {t("type")}
                            </label>
                            <div className="flex flex-wrap gap-2 pt-8 px-2 pb-2">
                                {EVENT_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        disabled={readOnly}
                                        onClick={() => setEventType(type.value)}
                                        className={`flex-1 min-w-[80px] py-2 rounded-xl text-[11px] font-bold transition-all border ${eventType === type.value
                                            ? `${type.color}`
                                            : "bg-white border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            } ${readOnly ? "cursor-default" : ""}`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* All Day Toggle */}
                        <div className={cn(
                            "flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 transition-all",
                            readOnly ? "cursor-default" : "cursor-pointer hover:border-brand-primary/30"
                        )} onClick={() => !readOnly && setAllDay(!allDay)}>
                            <Checkbox
                                id="allDay"
                                disabled={readOnly}
                                checked={allDay}
                                onChange={(e) => setAllDay(e.target.checked)}
                                className="w-5 h-5 rounded-md border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <label htmlFor="allDay" className={cn(
                                "text-[12px] text-gray-700 select-none",
                                readOnly ? "cursor-default" : "cursor-pointer"
                            )}>
                                {t("allDay")}
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-2">
                        {initialData && onDelete && !readOnly ? (
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-bold"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t("delete")}
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <div className="flex gap-3">
                            <ModalButton type="button" variant="ghost" onClick={handleRequestClose} className="font-bold text-gray-500">
                                {t("cancel")}
                            </ModalButton>
                            {!readOnly && (
                                <ModalButton type="submit" loading={isLoading} className="!flex-1 !bg-brand-primary !hover:bg-brand-secondary text-white px-8 rounded-xl font-bold">
                                    {t("save")}
                                </ModalButton>
                            )}
                        </div>
                    </div>
                </form>
            )
            }
            <AlertModal
                isOpen={isConfirmOpen}
                type="warning"
                title={t("delete")}
                message={t("errors.confirmDelete")}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                confirmText={t("delete")}
            />
            <AlertModal
                isOpen={isUnsavedConfirmOpen}
                type="warning"
                title={t("errors.unsavedChanges")}
                message={t("errors.loseChangesConfirm")}
                onClose={() => setIsUnsavedConfirmOpen(false)}
                onConfirm={() => {
                    setIsUnsavedConfirmOpen(false);
                    onClose();
                }}
                confirmText={t("close")}
            />
        </Modal >
    );
}
