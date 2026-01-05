"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    MessageSquare, Pin, Lock, Unlock,
    Trash2, Edit2, Check, X, User,
    Clock, MoreVertical, Info
} from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { UniversalTabSection } from "./tabs/UniversalTabSection";
import ModalButton from "@/components/ui/ModalButton";
import Modal from "@/components/ui/Modal";

type CaseNote = {
    id: string;
    content: string;
    isPrivate: boolean;
    isPinned: boolean;
    createdBy: string;
    createdAt: string;
};

interface CaseNotesCardProps {
    caseId: string;
}

export default function CaseNotesCard({ caseId }: CaseNotesCardProps) {
    const t = useTranslations("cases.notes");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const [notes, setNotes] = useState<CaseNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newContent, setNewContent] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        fetchNotes();
    }, [caseId]);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/notes`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newContent.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newContent,
                    isPrivate,
                    isPinned
                })
            });
            if (res.ok) {
                setNewContent("");
                setIsPrivate(false);
                setIsPinned(false);
                fetchNotes();
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePin = async (note: CaseNote) => {
        try {
            const res = await fetch(`/api/cases/${caseId}/notes?noteId=${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !note.isPinned })
            });
            if (res.ok) fetchNotes();
        } catch (error) {
            console.error("Error toggling pin:", error);
        }
    };

    const handleTogglePrivate = async (note: CaseNote) => {
        try {
            const res = await fetch(`/api/cases/${caseId}/notes?noteId=${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPrivate: !note.isPrivate })
            });
            if (res.ok) fetchNotes();
        } catch (error) {
            console.error("Error toggling privacy:", error);
        }
    };

    const handleUpdateContent = async (noteId: string) => {
        if (!editContent.trim()) return;
        try {
            const res = await fetch(`/api/cases/${caseId}/notes?noteId=${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent })
            });
            if (res.ok) {
                setEditingId(null);
                fetchNotes();
            }
        } catch (error) {
            console.error("Error updating note:", error);
        }
    };

    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [isDeletingNote, setIsDeletingNote] = useState(false);

    const handleDelete = async () => {
        if (!noteToDelete) return;
        setIsDeletingNote(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/notes?noteId=${noteToDelete}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchNotes();
                setNoteToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        } finally {
            setIsDeletingNote(false);
        }
    };

    return (
        <>
            <UniversalTabSection
                title={t("title")}
                icon={MessageSquare}
                count={notes.length}
                countLabel={t("recordedNotes")}
                data={notes}
                loading={isLoading}
                isRtl={isRtl}
                colorScheme="indigo"
                emptyTitle={t("emptyStateTitle")}
                emptyDescription={t("noNotes")}
                tipIcon={Info}
                tipTitle={isRtl ? "نصيحة للملاحظات" : "Notes Tip"}
                tipDescription={isRtl
                    ? "استخدم الملاحظات الخاصة لتدوين أفكارك الشخصية التي لا تريد مشاركتها مع العميل."
                    : "Use private notes to write down personal thoughts you don't want to share with the client."}
            >
                <div className="space-y-6">
                    {/* Input Area */}
                    <div className="bg-white border-b border-gray-50 p-6 transition-all">
                        <Textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder={t("placeholder") as string}
                            className="border-none bg-transparent p-0 min-h-[100px] text-[14px] font-medium focus:ring-white focus:outline-none focus:border-none shadow-none resize-none"
                        />
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={cn(
                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl border transition-all",
                                        isPinned ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                    )}
                                >
                                    <Pin className={cn("h-3.5 w-3.5", isPinned ? 'fill-current' : '')} />
                                    {t("pin")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={cn(
                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl border transition-all",
                                        isPrivate ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                    )}
                                >
                                    {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                    {t("private")}
                                </button>
                            </div>
                            <ModalButton
                                onClick={handleSave}
                                disabled={isSaving || !newContent.trim()}
                                loading={isSaving}
                                className="!min-h-[45px] !px-8 rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                {t("addNote")}
                            </ModalButton>
                        </div>
                    </div>

                    {notes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {notes.map((note) => (
                                <div key={note.id} className={cn(
                                    "group bg-white rounded-[20px] border p-6 transition-all duration-300 relative overflow-hidden",
                                    note.isPinned ? 'border-amber-100 bg-amber-50/5' : 'border-gray-100 hover:border-brand-primary/20'
                                )}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {note.isPinned && (
                                                <Badge className="!bg-amber-500/10 !text-amber-700 !border-amber-200/50 hover:bg-amber-500/15 text-[9px] font-black uppercase tracking-widest">
                                                    <Pin className="h-3 w-3 fill-current me-1.5" />
                                                    {t("pinned")}
                                                </Badge>
                                            )}
                                            {note.isPrivate && (
                                                <Badge className="!bg-rose-500/10 !text-rose-700 !border-rose-200/50 hover:bg-rose-500/15 text-[9px] font-black uppercase tracking-widest">
                                                    <Lock className="h-3 w-3 me-1.5" />
                                                    {t("private")}
                                                </Badge>
                                            )}
                                            <div className="flex items-center gap-1.5 text-gray-400 font-bold uppercase text-[9px] tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                                                <Clock className="h-3 w-3 text-indigo-400" />
                                                {(() => {
                                                    const d = new Date(note.createdAt);
                                                    return d.toLocaleString(locale, {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleTogglePin(note)} title={t("pin")} className={cn("p-1.5 rounded-lg transition-colors", note.isPinned ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:bg-gray-100")}>
                                                <Pin className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleTogglePrivate(note)} title={t("private")} className={cn("p-1.5 rounded-lg transition-colors", note.isPrivate ? "text-rose-500 bg-rose-50" : "text-gray-300 hover:bg-gray-100")}>
                                                <Lock className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => { setEditingId(note.id); setEditContent(note.content); }} title={tCommon("edit")} className="p-1.5 rounded-lg text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => setNoteToDelete(note.id)} title={tCommon("delete")} className="p-1.5 rounded-lg text-gray-300 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === note.id ? (
                                        <div className="space-y-3">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="text-[14px] min-h-[100px] font-medium p-3 rounded-2xl border-indigo-100 bg-gray-50 focus:bg-white transition-all"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="h-8 px-4 rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100">
                                                    {tCommon("cancel")}
                                                </button>
                                                <button onClick={() => handleUpdateContent(note.id)} className="h-8 px-4 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700">
                                                    {tCommon("save")}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[14px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                            {note.content}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </UniversalTabSection>

            <Modal
                isOpen={!!noteToDelete}
                onClose={() => setNoteToDelete(null)}
                title={isRtl ? "حذف الملاحظة" : "Delete Note"}
                className="!max-w-[400px]"
            >
                <div className="space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-[32px] bg-rose-50 flex items-center justify-center mx-auto">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {isRtl ? "هل أنت متأكد؟" : "Are you sure?"}
                            </h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {isRtl ? "سيتم حذف الملاحظة ولا يمكن التراجع" : "Note delete is permanent"}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed text-center px-4 max-w-[280px] mx-auto">
                        {tCommon("areYouSureDelete") || "Are you sure you want to delete this note?"}
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <ModalButton
                            variant="ghost"
                            onClick={() => setNoteToDelete(null)}
                            disabled={isDeletingNote}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            {tCommon("cancel")}
                        </ModalButton>
                        <ModalButton
                            onClick={handleDelete}
                            loading={isDeletingNote}
                            className="flex-1 h-12 rounded-xl !bg-rose-600 hover:!bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                        >
                            {tCommon("delete")}
                        </ModalButton>
                    </div>
                </div>
            </Modal>
        </>
    );
}
