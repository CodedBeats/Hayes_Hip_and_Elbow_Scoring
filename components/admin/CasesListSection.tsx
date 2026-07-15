"use client";
// dependencies
import { useMemo, useState } from "react";
// types
import { type Submission, type SubmissionStatus } from "@/types/submission";
// lib
import { getAdminCaseDisplayStatus } from "@/lib/status";
// components
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { CasesTable } from "@/components/admin/CasesTable";

interface CasesListSectionProps {
    submissions: Submission[];
    tableTitle: string;
    topBarTitle: string;
    topBarSubtitle: string;
    children?: React.ReactNode;
}

export const CasesListSection = ({
    submissions,
    tableTitle,
    topBarTitle,
    topBarSubtitle,
    children,
}: CasesListSectionProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");

    // Computed from the raw, unfiltered submissions so the dropdown's options don't
    // shrink away as the admin narrows the results down.
    const availableStatuses = useMemo(
        () => Array.from(new Set(submissions.map(getAdminCaseDisplayStatus))),
        [submissions],
    );

    const filtered = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return submissions.filter((submission) => {
            if (statusFilter !== "all" && getAdminCaseDisplayStatus(submission) !== statusFilter) {
                return false;
            }

            if (!query) return true;

            const idMatch = submission.id?.toLowerCase().includes(query) ?? false;
            if (submission.submissionType === "pdf") return idMatch;

            return (
                idMatch ||
                submission.dog.registeredName.toLowerCase().includes(query) ||
                submission.dog.breed.toLowerCase().includes(query) ||
                submission.owner.name.toLowerCase().includes(query)
            );
        });
    }, [submissions, searchTerm, statusFilter]);

    return (
        <>
            <AdminTopBar
                title={topBarTitle}
                subtitle={topBarSubtitle}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />
            {children}
            <CasesTable
                submissions={filtered}
                title={tableTitle}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                availableStatuses={availableStatuses}
            />
        </>
    );
};
