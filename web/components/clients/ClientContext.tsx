"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface ClientContextType {
    client: any | null;
    clientCases: any[];
    clientDocuments: any[];
    clientCasesTotal: number;
    clientDocumentsTotal: number;
    isLoading: boolean;
    isCasesLoading: boolean;
    isDocumentsLoading: boolean;
    refreshClient: () => Promise<void>;
    refreshCases: (options?: { page?: number, pageSize?: number }) => Promise<void>;
    refreshDocuments: (options?: { page?: number, pageSize?: number }) => Promise<void>;
    refreshAll: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = params?.id as string;

    const [client, setClient] = useState<any | null>(null);
    const [clientCases, setClientCases] = useState<any[]>([]);
    const [clientDocuments, setClientDocuments] = useState<any[]>([]);
    const [clientCasesTotal, setClientCasesTotal] = useState(0);
    const [clientDocumentsTotal, setClientDocumentsTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCasesLoading, setIsCasesLoading] = useState(false);
    const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

    const refreshClient = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/clients/${id}`);
            if (response.ok) {
                const data = await response.json();
                setClient(data);
            }
        } catch (error) {
            console.error("Error fetching client:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const refreshCases = useCallback(async (options?: { page?: number, pageSize?: number }) => {
        if (!id) return;
        setIsCasesLoading(true);
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 10;
        try {
            const response = await fetch(`/api/cases?clientId=${id}&page=${page}&pageSize=${pageSize}`);
            if (response.ok) {
                const data = await response.json();
                setClientCases(data.items || []);
                setClientCasesTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching client cases:", error);
        } finally {
            setIsCasesLoading(false);
        }
    }, [id]);

    const refreshDocuments = useCallback(async (options?: { page?: number, pageSize?: number }) => {
        if (!id) return;
        setIsDocumentsLoading(true);
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 10;
        try {
            const response = await fetch(`/api/client-documents?clientId=${id}&page=${page}&pageSize=${pageSize}`);
            if (response.ok) {
                const data = await response.json();
                setClientDocuments(data.items || []);
                setClientDocumentsTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching client documents:", error);
        } finally {
            setIsDocumentsLoading(false);
        }
    }, [id]);

    const refreshAll = useCallback(async () => {
        await Promise.all([refreshClient(), refreshCases(), refreshDocuments()]);
    }, [refreshClient, refreshCases, refreshDocuments]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return (
        <ClientContext.Provider
            value={{
                client,
                clientCases,
                clientDocuments,
                clientCasesTotal,
                clientDocumentsTotal,
                isLoading,
                isCasesLoading,
                isDocumentsLoading,
                refreshClient,
                refreshCases,
                refreshDocuments,
                refreshAll
            }}
        >
            {children}
        </ClientContext.Provider>
    );
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useClient must be used within a ClientProvider");
    }
    return context;
}
