import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Zap, X, Search, FileText, CalendarPlus, UserPlus, Briefcase, Send, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "markdown-to-jsx";
// import { useChat } from "@ai-sdk/react"; // Disabled due to instability
import { cn } from "@/lib/utils";

interface FloatingAssistantProps {
    isRTL: boolean;
    locale: string;
}

export function FloatingAssistant({ isRTL, locale }: FloatingAssistantProps) {
    const router = useRouter();
    const [chatOpen, setChatOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [teaserMessage, setTeaserMessage] = useState<string | null>(null);

    const sideClass = isRTL ? "left-6" : "right-6";
    const alignClass = "items-end";
    const directionClass = "flex-row";

    // Teaser Logic
    useEffect(() => {
        const teasers = isRTL
            ? ["مرحباً، هل تحتاج مساعدة؟", "اسألني عن قضاياك", "هل لديك مهام اليوم؟"]
            : ["Hi, need help?", "Ask about your cases", "Any tasks for today?"];

        // Show a teaser after 5s, then hide after 5s
        const showTimer = setTimeout(() => {
            setTeaserMessage(teasers[Math.floor(Math.random() * teasers.length)]);
        }, 5000);

        return () => clearTimeout(showTimer);
    }, [isRTL]);

    const actions = [
        { key: "newClient", icon: UserPlus, color: "bg-brand-primary", onClick: () => router.push(`/${locale}/dashboard/clients/new`) },
        { key: "newCase", icon: Briefcase, color: "bg-brand-primary", onClick: () => router.push(`/${locale}/dashboard/cases/new`) },
        { key: "calendar", icon: CalendarPlus, color: "bg-brand-primary", onClick: () => router.push(`/${locale}/dashboard/calendar/new`) },
        { key: "documents", icon: FileText, color: "bg-brand-primary", onClick: () => router.push(`/${locale}/dashboard/documents`) },
        { key: "dashboard", icon: Search, color: "bg-gray-900", onClick: () => router.push(`/${locale}/dashboard`) },
    ];

    return (
        <>
            {/* Expanded Mode Backdrop */}
            <AnimatePresence>
                {(chatOpen && isExpanded) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99999]"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            <div className={`fixed bottom-6 ${sideClass} z-[100000] flex flex-col ${alignClass} pointer-events-none`}>

                {/* Teaser Bubble */}
                <AnimatePresence>
                    {teaserMessage && !chatOpen && !actionsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className={`mb-3 pointer-events-auto bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-2 flex items-center gap-2 max-w-[200px]`}
                        >
                            <Sparkles className="h-4 w-4 text-brand-primary shrink-0" />
                            <span className="text-xs font-medium text-gray-700">{teaserMessage}</span>
                            <button onClick={() => setTeaserMessage(null)} className="ml-auto hover:bg-gray-100 rounded-full p-0.5">
                                <X className="h-3 w-3 text-gray-400" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Trigger Button */}
                <div className={`flex ${directionClass} gap-3 items-center pointer-events-auto`}>
                    <motion.button
                        aria-label={actionsOpen ? "Close" : "Open Actions"}
                        onClick={() => setActionsOpen((v) => !v)}
                        className="relative h-14 w-14 rounded-full bg-brand-primary focus:outline-none shadow-lg shadow-brand-primary/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="absolute inset-0 rounded-full blur-xl bg-blue-400/40" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_60%)]" />
                        <motion.span
                            key={actionsOpen ? "close" : "open"}
                            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                            className="relative flex items-center justify-center w-full h-full"
                        >
                            {actionsOpen ? (
                                <X className="h-6 w-6 text-white" />
                            ) : (
                                <Zap className="h-6 w-6 text-white" />
                            )}
                        </motion.span>
                    </motion.button>
                </div>

                {/* Quick Actions Bar */}
                <AnimatePresence>
                    {actionsOpen && (
                        <div className="pointer-events-auto">
                            <QuickActionsBar
                                isRTL={isRTL}
                                locale={locale}
                                onAssistant={() => {
                                    setTeaserMessage(null);
                                    setChatOpen(true);
                                    setActionsOpen(false);
                                }}
                                actions={actions}
                                sideClass={sideClass}
                                onClose={() => setActionsOpen(false)}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {chatOpen && (
                    <ChatWindow
                        isRTL={isRTL}
                        locale={locale}
                        isExpanded={isExpanded}
                        onExpand={() => setIsExpanded(!isExpanded)}
                        onClose={() => setChatOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ----------------------------------------------------------------------

function ChatWindow({
    isRTL,
    locale,
    isExpanded,
    onExpand,
    onClose
}: {
    isRTL: boolean;
    locale: string;
    isExpanded: boolean;
    onExpand: () => void;
    onClose: () => void;
}) {
    // Manual Fetch State
    const [messages, setMessages] = useState<any[]>([
        {
            id: "welcome",
            role: "assistant",
            content: locale === "ar"
                ? "مرحباً ! أنا مساعدك الذكي. يمكنني مساعدتك في البحث داخل القضايا والمواعيد والمهل والعملاء والتذكيرات. كيف يمكنني مساعدتك اليوم ؟"
                : "Hello! I'm your AI assistant. I can help you query cases, events, deadlines, clients, and reminders. How can I help you today ?",
            createdAt: new Date(),
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", content: input, createdAt: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare messages for API (remove createdAt, etc if needed, but simple array is usually fine)
            // We just send role and content
            // Need to map previous messages to simpler format {role, content}
            const apiMessages = messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                body: JSON.stringify({ messages: apiMessages }),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed");

            const data = await res.json();
            // Expect { role: 'assistant', content: '...' }
            setMessages(prev => [...prev, { ...data, createdAt: new Date() }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. / عذراً، حدث خطأ.", createdAt: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sideClass = isRTL ? "left-6" : "right-6";

    // Dynamic classes based on expansion
    const containerClasses = isExpanded
        ? "fixed inset-0 m-auto w-[90vw] md:w-[800px] h-[85vh] z-[100001]"
        : `fixed bottom-24 ${sideClass} z-[100000] w-[380px] h-[600px]`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={containerClasses}
        >
            <div className={`relative bg-white backdrop-blur-xl border border-white/50 p-2 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] h-full flex flex-col overflow-hidden`}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center shadow-md">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-900 font-[family-name:var(--font-aviner)]">
                                {locale === "ar" ? "المساعد الذكي" : "AI Assistant"}
                            </span>
                            <span className="text-[10px] text-brand-primary font-medium flex items-center gap-1">
                                <span className={`relative flex h-2 w-2 ${isLoading ? "animate-pulse" : ""}`}>
                                    {isLoading ? (
                                        <>
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </>
                                    )}
                                </span>
                                {isLoading
                                    ? (locale === "ar" ? "يكتب..." : "Thinking...")
                                    : (locale === "ar" ? "متصل" : "Online")
                                }
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={onExpand}
                            className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center"
                            title={isExpanded ? "Minimize" : "Maximize"}
                        >
                            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto bg-white">
                    {messages.map((m, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[75%] ${m.role === "user" ? "bg-brand-primary text-white" : "bg-gray-50 text-gray-900"} px-4 py-3 rounded-2xl ${m.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                                <div className={`text-sm leading-relaxed ${m.role === "assistant" ? "prose prose-sm max-w-none prose-p:my-1 font-[family-name:var(--font-aviner)]" : ""}`}>
                                    {m.role === "assistant" ? (
                                        <Markdown options={{
                                            overrides: {
                                                h1: { component: 'h1', props: { className: 'text-lg font-bold mb-2' } },
                                                h2: { component: 'h2', props: { className: 'text-base font-bold mb-2' } },
                                                ul: { component: 'ul', props: { className: 'list-disc ps-4 space-y-1 mb-2' } },
                                                ol: { component: 'ol', props: { className: 'list-decimal ps-4 space-y-1 mb-2' } },
                                                li: { component: 'li', props: { className: 'mb-0.5' } },
                                                p: { component: 'p', props: { className: 'mb-0 text-gray-800' } },
                                                a: { component: 'a', props: { className: 'text-brand-primary hover:underline' } },
                                                code: { component: 'code', props: { className: 'bg-gray-100 px-1 py-0.5 rounded text-xs' } },
                                            }
                                        }}>
                                            {m.content}
                                        </Markdown>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                                <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-white/70" : "text-gray-400"} text-end`}>
                                    {m.createdAt ? m.createdAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : ""}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 backdrop-blur">
                    <div className={`flex ${isRTL ? "" : "flex-row-reverse"} items-end gap-2 bg-gray-50 p-2 rounded-[20px] border border-gray-200 focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all`}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="flex-1 max-h-[120px] min-h-[44px] bg-transparent border-none px-3 py-2.5 text-sm focus:outline-none resize-none font-[family-name:var(--font-aviner)]"
                            placeholder={locale === "ar" ? "اكتب رسالة... (Shift+Enter لسطر جديد)" : "Type a message..."}
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="h-[44px] w-[44px] shrink-0 rounded-[10px] bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send className={`h-4 w-4 ${isRTL ? "-ml-0.5" : "-mr-0.5"}`} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------------------------

type ActionItem = {
    key: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    color?: string;
    special?: boolean;
};

function QuickActionsBar({
    isRTL,
    locale,
    onAssistant,
    actions,
    sideClass,
    onClose
}: {
    isRTL: boolean;
    locale: string;
    onAssistant: () => void;
    actions: { key: string; icon: React.ComponentType<{ className?: string }>; color: string; onClick: () => void }[];
    sideClass: string;
    onClose: () => void
}) {
    const dirClass = isRTL ? "flex-col md:flex-row" : "flex-col md:flex-row-reverse";

    const labels = locale === "ar"
        ? { assistant: "المساعد الذكي", newClient: "عميل جديد", newCase: "قضية جديدة", calendar: "موعد جديد", documents: "الوثائق", dashboard: "لوحة التحكم" }
        : { assistant: "AI Assistant", newClient: "New Client", newCase: "New Case", calendar: "New Event", documents: "Documents", dashboard: "Dashboard" };

    const items: ActionItem[] = [
        { key: "assistant", icon: Bot, label: labels.assistant, special: true, onClick: onAssistant },
        ...actions.map<ActionItem>(a => ({ key: a.key, icon: a.icon, label: labels[a.key as keyof typeof labels] || a.key, color: a.color, onClick: a.onClick }))
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={`fixed bottom-24 ${sideClass} z-[100000]`}
        >
            <div className={`backdrop-blur-[20px] bg-white/70 border border-white/50 shadow-[0_30px_60px_rgba(0,0,0,0.15)] rounded-[24px] p-4 flex ${dirClass} gap-4`}>
                {items.map((item) => {
                    const Icon = item.icon;
                    const isSpecial = item.special;
                    const base = "w-[64px] h-[64px]";
                    const textColor = item.color ? item.color.replace("bg-", "text-") : "text-brand-primary";
                    return (
                        <motion.button
                            key={item.key}
                            onClick={() => { item.onClick(); onClose(); }}
                            whileHover={{ scale: 1.06, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`group relative cursor-pointer flex flex-col items-center justify-center ${base} rounded-[20px] transition-all`}
                        >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isSpecial ? "bg-brand-primary text-white" : "bg-gray-50 text-gray-700 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <span className="mt-1.5 text-[9px] font-bold text-gray-600 group-hover:text-gray-900">
                                {item.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
