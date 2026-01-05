/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = "" }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-100000 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-[30px] min-h-[300px] content-center shadow-xl w-full max-w-lg ${className}`}>
                <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );

    return mounted ? createPortal(content, document.body) : null;
}
