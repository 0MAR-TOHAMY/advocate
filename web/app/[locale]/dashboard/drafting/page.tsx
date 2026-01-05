"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, MessageSquare, Trash2, Send, Loader2, Sparkles, Menu, X, Copy, Check, Pencil, Pin, PinOff, Save } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ChatSession {
    id: string;
    title: string | null;
    updatedAt: string;
    isFavorite: boolean;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
}

export default function DraftingPage() {
    const params = useParams();
    const locale = (params?.locale as string) || "ar";
    const isRTL = locale === "ar";

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const t = useTranslations('drafting');

    const labels = {
        title: t('title'),
        newChat: t('newChat'),
        placeholder: t('placeholder'),
        send: t('send'),
        today: t('today'),
        yesterday: t('yesterday'),
        thisWeek: t('thisWeek'),
        older: t('older'),
        noChats: t('noChats'),
        startMessage: t('startMessage'),
        deleteConfirm: t('deleteConfirm'),
        history: t('history'),
        copied: t('copied'),
        copy: t('copy'),
        typing: t('typing'),
        poweredBy: t('poweredBy'),
        errorDisclaimer: t('errorDisclaimer'),
        pinned: t('pinned'),
        rename: t('rename'),
        favorite: t('favorite'),
        editTitle: t('editTitle'),
        save: t('save'),
        cancel: t('cancel'),
    };

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Fetch sessions on mount
    useEffect(() => {
        fetchSessions();
    }, []);

    // Fetch messages when session changes
    useEffect(() => {
        if (activeSessionId) {
            fetchMessages(activeSessionId);
        } else {
            setMessages([]);
        }
    }, [activeSessionId]);

    const fetchSessions = async () => {
        try {
            const res = await fetch("/api/chat/sessions");
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setSessionsLoading(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/chat/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setInput("");
    };

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(labels.deleteConfirm)) return;

        try {
            const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
                if (activeSessionId === sessionId) {
                    handleNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const handleUpdateSession = async (sessionId: string, updates: Partial<ChatSession>) => {
        try {
            // Optimistic update
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));

            const res = await fetch(`/api/chat/sessions/${sessionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                // Revert on failure
                fetchSessions();
            }
        } catch (error) {
            console.error("Failed to update session:", error);
            fetchSessions();
        }
    };

    const handleCopy = async (content: string, messageId: string) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(content);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = content;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            }
            setCopiedId(messageId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: input.trim(),
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    message: userMessage.content,
                }),
            });

            if (res.ok) {
                const data = await res.json();

                // Update active session
                if (!activeSessionId) {
                    setActiveSessionId(data.sessionId);
                    fetchSessions();
                }

                // Add assistant message with timestamp
                setMessages((prev) => [...prev, {
                    ...data.message,
                    createdAt: new Date().toISOString(),
                }]);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const groupSessionsByDate = (sessions: ChatSession[]) => {
        const groups: { [key: string]: ChatSession[] } = {
            pinned: [],
            today: [],
            yesterday: [],
            thisWeek: [],
            older: [],
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        sessions.forEach((session) => {
            const sessionDate = new Date(session.updatedAt);
            if (session.isFavorite) {
                groups.pinned.push(session);
            } else if (sessionDate >= today) {
                groups.today.push(session);
            } else if (sessionDate >= yesterday) {
                groups.yesterday.push(session);
            } else if (sessionDate >= weekAgo) {
                groups.thisWeek.push(session);
            } else {
                groups.older.push(session);
            }
        });

        return groups;
    };

    const groupedSessions = groupSessionsByDate(sessions);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-[25px]" dir={isRTL ? "rtl" : "ltr"}>
            {/* Sidebar */}
            <div className={cn(
                "bg-gray-50 text-white flex flex-col transition-all duration-300 shrink-0",
                sidebarOpen ? "w-72" : "w-0 overflow-hidden"
            )}>
                {/* Sidebar Header */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-[15px] font-medium transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        {labels.newChat}
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1">
                    {sessionsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-500 text-sm">{labels.noChats}</p>
                        </div>
                    ) : (
                        <>
                            {groupedSessions.pinned.length > 0 && (
                                <div className="mb-2">
                                    <p className="flex items-center gap-1.5 text-xs font-medium text-brand-primary uppercase px-3 py-2">
                                        <Pin className="w-3 h-3" />
                                        {labels.pinned}
                                    </p>
                                    {groupedSessions.pinned.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSessionId === session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            onDelete={(e) => handleDeleteSession(session.id, e)}
                                            onUpdate={handleUpdateSession}
                                            isRTL={isRTL}
                                            labels={labels}
                                        />
                                    ))}
                                </div>
                            )}
                            {groupedSessions.today.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">{labels.today}</p>
                                    {groupedSessions.today.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSessionId === session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            onDelete={(e) => handleDeleteSession(session.id, e)}
                                            onUpdate={handleUpdateSession}
                                            isRTL={isRTL}
                                            labels={labels}
                                        />
                                    ))}
                                </div>
                            )}
                            {groupedSessions.yesterday.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">{labels.yesterday}</p>
                                    {groupedSessions.yesterday.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSessionId === session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            onDelete={(e) => handleDeleteSession(session.id, e)}
                                            onUpdate={handleUpdateSession}
                                            isRTL={isRTL}
                                            labels={labels}
                                        />
                                    ))}
                                </div>
                            )}
                            {groupedSessions.thisWeek.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">{labels.thisWeek}</p>
                                    {groupedSessions.thisWeek.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSessionId === session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            onDelete={(e) => handleDeleteSession(session.id, e)}
                                            onUpdate={handleUpdateSession}
                                            isRTL={isRTL}
                                            labels={labels}
                                        />
                                    ))}
                                </div>
                            )}
                            {groupedSessions.older.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">{labels.older}</p>
                                    {groupedSessions.older.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSessionId === session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            onDelete={(e) => handleDeleteSession(session.id, e)}
                                            onUpdate={handleUpdateSession}
                                            isRTL={isRTL}
                                            labels={labels}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white min-w-0 relative">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
                    </button>
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">{labels.title}</h2>
                            <p className="text-xs text-gray-500">{labels.poweredBy}</p>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto"
                >
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        {messages.length === 0 ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">{labels.title}</h2>
                                <p className="text-gray-500 text-sm max-w-md">{labels.startMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isRTL={isRTL}
                                        onCopy={() => handleCopy(message.content, message.id)}
                                        isCopied={copiedId === message.id}
                                        formatTime={formatTime}
                                        labels={labels}
                                    />
                                ))}
                                {loading && (
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <span className="text-sm">{labels.typing}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} className="h-32" />
                </div>

                {/* Floating Input Area */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={labels.placeholder}
                                rows={1}
                                className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 pr-14 text-sm focus:outline-none placeholder:text-gray-400"
                                style={{ minHeight: '56px', maxHeight: '200px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className={cn(
                                    "absolute bottom-1/2 translate-y-1/2 p-4 rounded-lg transition-all",
                                    isRTL ? "left-2" : "right-2",
                                    input.trim() && !loading
                                        ? "bg-brand-primary text-white hover:opacity-90"
                                        : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className={cn("w-4 h-4")} />
                                )}
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            {labels.errorDisclaimer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Message Bubble Component
function MessageBubble({
    message,
    isRTL,
    onCopy,
    isCopied,
    formatTime,
    labels,
}: {
    message: ChatMessage;
    isRTL: boolean;
    onCopy: () => void;
    isCopied: boolean;
    formatTime: (date?: string) => string;
    labels: { copy: string; copied: string };
}) {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%]">
                    <div className="bg-brand-primary text-white px-5 py-3.5 rounded-3xl rounded-br-lg shadow-sm">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                    </div>
                    <p className={cn("text-[11px] text-gray-400 mt-1.5 px-1", isRTL ? "text-left" : "text-right")}>
                        {formatTime(message.createdAt)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 group">
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50/80 border border-gray-100 px-6 py-5 rounded-3xl rounded-tl-lg">
                    <div className="prose prose-base max-w-none 
                        prose-p:my-2 prose-p:leading-7 prose-p:text-gray-700
                        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:my-4
                        prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:text-gray-700
                        prose-pre:bg-gray-900 prose-pre:text-gray-50 prose-pre:border prose-pre:border-gray-800
                        prose-code:text-brand-primary prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                        font-[family-name:var(--font-aviner)]">
                        <Markdown
                            options={{
                                overrides: {
                                    pre: {
                                        props: {
                                            className: "rounded-xl overflow-x-auto p-4 my-4 shadow-sm",
                                        },
                                    },
                                    code: {
                                        props: {
                                            className: "text-sm font-mono",
                                        },
                                    },
                                },
                            }}
                        >
                            {message.content}
                        </Markdown>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-2 px-1">
                    <p className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</p>
                    <button
                        onClick={onCopy}
                        className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        {isCopied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-green-600 font-medium">{labels.copied}</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{labels.copy}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Session Item Component
function SessionItem({
    session,
    isActive,
    onClick,
    onDelete,
    onUpdate,
    isRTL,
    labels,
}: {
    session: ChatSession;
    isActive: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onUpdate: (id: string, updates: Partial<ChatSession>) => void;
    isRTL: boolean;
    labels: any;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(session.title || "");

    // Format helper for session timestamp
    const formatSessionTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const handleSaveTitle = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editTitle.trim()) {
            onUpdate(session.id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle(e as any);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditTitle(session.title || "");
        }
    };

    return (
        <div
            onClick={!isEditing ? onClick : undefined}
            className={cn(
                "group flex flex-col gap-1 px-3 py-3 rounded-xl cursor-pointer transition-all border relative",
                isActive
                    ? "bg-white border-gray-200 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-gray-100/50 hover:border-gray-200/50"
            )}
        >
            <div className="flex items-center gap-2.5">
                <MessageSquare className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-brand-primary" : "text-gray-400 group-hover:text-gray-500"
                )} />

                {isEditing ? (
                    <div className="flex-1 flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                        <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-white border border-brand-primary rounded px-1.5 py-0.5 text-xs text-gray-900 focus:outline-none"
                            placeholder={labels.editTitle}
                        />
                        <button
                            onClick={handleSaveTitle}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                            <Save className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(false);
                                setEditTitle(session.title || "");
                            }}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <span className={cn(
                        "flex-1 truncate text-sm font-medium transition-colors select-none",
                        isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                    )}>
                        {session.title || (isRTL ? "محادثة جديدة" : "New Chat")}
                    </span>
                )}

                {/* Actions (visible on hover or active) */}
                <div className={cn(
                    "flex items-center gap-1 transition-opacity",
                    isActive || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    {!isEditing && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(session.id, { isFavorite: !session.isFavorite });
                                }}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    session.isFavorite ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                )}
                                title={labels.favorite}
                            >
                                {session.isFavorite ? <Pin className="w-3.5 h-3.5 fill-current" /> : <Pin className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                                title={labels.rename}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                                title={labels.deleteConfirm}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Last updated timestamp */}
            <div className={cn(
                "flex items-center text-[10px] text-gray-400 px-6.5",
                isRTL ? "justify-start" : "justify-end"
            )}>
                <span>{formatSessionTime(session.updatedAt)}</span>
            </div>
        </div>
    );
}
