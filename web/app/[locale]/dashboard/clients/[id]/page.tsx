"use client";

import { ClientProvider } from "@/components/clients/ClientContext";
import ClientDetailContent from "./ClientDetailContent";

export default function ClientDetailPage() {
    return (
        <ClientProvider>
            <ClientDetailContent />
        </ClientProvider>
    );
}
