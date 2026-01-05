"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface CaseContextType {
    caseData: any;
    documents: any[];
    hearings: any[];
    expenses: any[];
    judgments: any[];
    updates: any[];
    tasks: any[];
    members: any[];
    documentsTotal: number;
    hearingsTotal: number;
    expensesTotal: number;
    tasksTotal: number;
    judgmentsTotal: number; // Added
    updatesTotal: number; // Added

    // Loading states
    isLoading: boolean;
    isDocumentsLoading: boolean;
    isHearingsLoading: boolean;
    isExpensesLoading: boolean;
    isJudgmentsLoading: boolean;
    isUpdatesLoading: boolean;
    isTasksLoading: boolean;

    // Refresh methods
    refreshAll: () => Promise<void>;
    refreshCaseData: () => Promise<void>;
    refreshDocuments: (params?: any) => Promise<void>;
    refreshHearings: (params?: any) => Promise<void>;
    refreshExpenses: (params?: any) => Promise<void>;
    refreshJudgments: (params?: any) => Promise<void>;
    refreshUpdates: (params?: any) => Promise<void>;
    refreshTasks: (params?: any) => Promise<void>;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children, caseId }: { children: React.ReactNode; caseId: string }) {
    const [caseData, setCaseData] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [hearings, setHearings] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [judgments, setJudgments] = useState<any[]>([]);
    const [updates, setUpdates] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    const [documentsTotal, setDocumentsTotal] = useState(0);
    const [hearingsTotal, setHearingsTotal] = useState(0);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [tasksTotal, setTasksTotal] = useState(0);
    const [judgmentsTotal, setJudgmentsTotal] = useState(0); // Added
    const [updatesTotal, setUpdatesTotal] = useState(0); // Added

    const [isLoading, setIsLoading] = useState(true);
    const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
    const [isHearingsLoading, setIsHearingsLoading] = useState(false);
    const [isExpensesLoading, setIsExpensesLoading] = useState(false);
    const [isJudgmentsLoading, setIsJudgmentsLoading] = useState(false);
    const [isUpdatesLoading, setIsUpdatesLoading] = useState(false);
    const [isTasksLoading, setIsTasksLoading] = useState(false);

    const fetchData = useCallback(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        return res.json();
    }, []);

    const refreshCaseData = useCallback(async () => {
        try {
            const data = await fetchData(`/api/cases/${caseId}`);
            setCaseData(data);
        } catch (e) {
            console.error(e);
        }
    }, [caseId, fetchData]);

    const appendParams = (searchParams: URLSearchParams, params: any) => {
        if (!params) return;
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.set(key, String(value));
            }
        });
    };

    const refreshDocuments = useCallback(async (params?: any) => {
        setIsDocumentsLoading(true);
        try {
            const searchParams = new URLSearchParams({ caseId, pageSize: "100" });
            appendParams(searchParams, params);

            const data = await fetchData(`/api/documents?${searchParams.toString()}`);
            setDocuments(data.items || data || []);
            setDocumentsTotal(data.total || (Array.isArray(data) ? data.length : 0));
        } catch (e) {
            console.error(e);
        } finally {
            setIsDocumentsLoading(false);
        }
    }, [caseId, fetchData]);

    const refreshHearings = useCallback(async (params?: any) => {
        setIsHearingsLoading(true);
        try {
            const searchParams = new URLSearchParams({ caseId, pageSize: "100", sort: "hearingDate", order: "desc" });
            appendParams(searchParams, params);

            const data = await fetchData(`/api/hearings?${searchParams.toString()}`);
            setHearings(data.items || []);
            setHearingsTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsHearingsLoading(false);
        }
    }, [caseId, fetchData]);

    const refreshExpenses = useCallback(async (params?: any) => {
        setIsExpensesLoading(true);
        try {
            const searchParams = new URLSearchParams({ caseId, pageSize: "100" });
            appendParams(searchParams, params);

            const data = await fetchData(`/api/expenses?${searchParams.toString()}`);
            setExpenses(data.items || data || []);
            setExpensesTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsExpensesLoading(false);
        }
    }, [caseId, fetchData]);

    const refreshJudgments = useCallback(async (params?: any) => {
        setIsJudgmentsLoading(true);
        try {
            const searchParams = new URLSearchParams({ pageSize: "10" }); // default pageSize
            appendParams(searchParams, params);

            const data = await fetchData(`/api/cases/${caseId}/judgments?${searchParams.toString()}`);
            setJudgments(data.items || data || []);
            setJudgmentsTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsJudgmentsLoading(false);
        }
    }, [caseId, fetchData]);

    const refreshUpdates = useCallback(async (params?: any) => {
        setIsUpdatesLoading(true);
        try {
            const searchParams = new URLSearchParams({ pageSize: "10" });
            appendParams(searchParams, params);

            const data = await fetchData(`/api/cases/${caseId}/updates?${searchParams.toString()}`);
            setUpdates(data.items || data || []);
            setUpdatesTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdatesLoading(false);
        }
    }, [caseId, fetchData]);

    const refreshTasks = useCallback(async (params?: any) => {
        setIsTasksLoading(true);
        try {
            const searchParams = new URLSearchParams({ caseId, eventType: "deadline", pageSize: "10" });
            appendParams(searchParams, params);

            const data = await fetchData(`/api/events?${searchParams.toString()}`);
            setTasks(data.items || data || []);
            setTasksTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTasksLoading(false);
        }
    }, [caseId, fetchData]);

    const fetchMembers = useCallback(async () => {
        try {
            const meRes = await fetch("/api/auth/me");
            const meData = await meRes.json();
            const firmId = meData?.user?.firmId;
            if (firmId) {
                const uRes = await fetch(`/api/firms/${firmId}/users`);
                if (uRes.ok) {
                    const data = await uRes.json();
                    setMembers(data.members || []);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        await Promise.allSettled([
            refreshCaseData(),
            refreshDocuments(),
            refreshHearings(),
            refreshExpenses(),
            refreshJudgments(),
            refreshUpdates(),
            refreshTasks(),
            fetchMembers()
        ]);
        setIsLoading(false);
    }, [refreshCaseData, refreshDocuments, refreshHearings, refreshExpenses, refreshJudgments, refreshUpdates, refreshTasks, fetchMembers]);

    // Initial fetch
    useEffect(() => {
        if (caseId) {
            refreshAll();
        }
    }, [caseId]);

    return (
        <CaseContext.Provider value={{
            caseData,
            documents,
            hearings,
            expenses,
            judgments,
            updates,
            tasks,
            members,
            documentsTotal,
            hearingsTotal,
            expensesTotal,
            tasksTotal,
            judgmentsTotal,
            updatesTotal,
            isLoading,
            isDocumentsLoading,
            isHearingsLoading,
            isExpensesLoading,
            isJudgmentsLoading,
            isUpdatesLoading,
            isTasksLoading,
            refreshAll,
            refreshCaseData,
            refreshDocuments,
            refreshHearings,
            refreshExpenses,
            refreshJudgments,
            refreshUpdates,
            refreshTasks
        }}>
            {children}
        </CaseContext.Provider>
    );
}

export function useCase() {
    const context = useContext(CaseContext);
    if (context === undefined) {
        throw new Error("useCase must be used within a CaseProvider");
    }
    return context;
}
