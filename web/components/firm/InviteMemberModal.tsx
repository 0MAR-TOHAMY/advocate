"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Mail, Link as LinkIcon, Check, Copy, UserPlus, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    firmId: string;
    firmTag: string; // Needed for link generation
}

export function InviteMemberModal({ isOpen, onClose, firmId, firmTag }: InviteMemberModalProps) {
    const t = useTranslations("team.invitation"); // Updated namespace
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

    const handleInvite = async () => {
        if (!email) return;
        setLoading(true);
        setAlert(null);
        try {
            const res = await fetch(`/api/firms/${firmId}/invitations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }), // No roleId
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setAlert({ type: "success", message: t("success") });
                setEmail("");
                setTimeout(() => {
                    onClose();
                    setAlert(null);
                }, 2000);
            } else {
                setAlert({ type: "error", message: data.message || t("error") });
            }
        } catch (e) {
            console.error(e);
            setAlert({ type: "error", message: t("error") });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const joinLink = `${window.location.origin}/firms/join?tag=${firmTag}`;

        const onCopySuccess = () => {
            setCopied(true);
            setAlert({ type: "success", message: t("copied") });
            setTimeout(() => setCopied(false), 2000);
        };

        const onCopyError = () => {
            setAlert({ type: "error", message: "Could not copy link" });
        };

        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(joinLink).then(onCopySuccess).catch(() => {
                fallbackCopy(joinLink, onCopySuccess, onCopyError);
            });
        } else {
            // Fallback for non-secure contexts or older browsers
            fallbackCopy(joinLink, onCopySuccess, onCopyError);
        }
    };

    const fallbackCopy = (text: string, onSuccess: () => void, onError: () => void) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                onSuccess();
            } else {
                onError();
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
            onError();
        }

        document.body.removeChild(textArea);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {alert && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            onClose={() => setAlert(null)}
                            duration={3000}
                        />
                    </div>
                )}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[30px] bg-white p-8 text-start align-middle shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] transition-all">
                                <div className="flex justify-between items-center mb-8">
                                    <Dialog.Title as="h3" className="text-[20px] font-bold text-gray-900 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-[12px] bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                            <UserPlus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            {t("title")}
                                            <p className="text-xs text-gray-400 font-normal mt-1">{t("subtitle")}</p>
                                        </div>
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Email Invite Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-wide">
                                            <Mail className="w-4 h-4" />
                                            {t("viaEmail")}
                                        </div>
                                        <div className="space-y-4 bg-gray-50 p-6 rounded-[20px] border border-gray-100">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">{t("email")}</label>
                                                <Input
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="colleague@example.com"
                                                    className="bg-white border-gray-200 rounded-xl"
                                                />
                                            </div>

                                            <p className="text-xs text-gray-400">{t("info")}</p>

                                            <Button
                                                onClick={handleInvite}
                                                disabled={!email || loading}
                                                loading={loading}
                                                className="w-full h-12 rounded-xl font-bold bg-brand-primary hover:opacity-90 shadow-lg shadow-brand-primary/20"
                                            >
                                                {loading ? t("saving") : t("sendInvite")}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-gray-100"></div>
                                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">{t("or")}</span>
                                        <div className="flex-grow border-t border-gray-100"></div>
                                    </div>

                                    {/* Copy Link Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-wide">
                                            <LinkIcon className="w-4 h-4" />
                                            {t("viaLink")}
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-[18px] border border-gray-100 pr-2">
                                            <div className="flex-1 px-4 py-2 truncate text-sm text-gray-500 font-mono">
                                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/firms/join?tag=${firmTag}`}
                                            </div>
                                            <Button
                                                onClick={handleCopyLink}
                                                variant="outline"
                                                className={cn(
                                                    "rounded-xl h-10 px-4 font-bold border-gray-200",
                                                    copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white hover:bg-white"
                                                )}
                                            >
                                                {copied ? (
                                                    <><Check className="w-4 h-4 me-2" /> {t("copied")}</>
                                                ) : (
                                                    <><Copy className="w-4 h-4 me-2" /> {t("copy")}</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
