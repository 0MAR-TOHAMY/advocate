"use client";

import { CaseProvider } from "@/components/cases/CaseContext";
import { useParams } from "next/navigation";
import CaseDetailContent from "./CaseDetailContent";

export default function CaseDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    if (!id) return null;

    return (
        <CaseProvider caseId={id}>
            <CaseDetailContent />
        </CaseProvider>
    );
}
