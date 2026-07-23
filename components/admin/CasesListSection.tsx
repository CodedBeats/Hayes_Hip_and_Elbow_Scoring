"use client";
// dependencies
import { useMemo, useState } from "react";
// types
import { type Submission, type SubmissionStatus, type CaseSubmissionSortOrder } from "@/types/submission";
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
    const [sortOrder, setSortOrder] = useState<CaseSubmissionSortOrder>("newest");

    // Computed from the raw, unfiltered submissions so the dropdown's options don't
    // shrink away as the admin narrows the results down.
    const availableStatuses = useMemo(
        () => Array.from(new Set(submissions.map(getAdminCaseDisplayStatus))),
        [submissions],
    );

    /**
     * Search/filter/sort composition applied to `submissions` for display.
     *
     * @remarks
     * Filters by {@link getAdminCaseDisplayStatus} (never the raw `submission.status`),
     * so an unpaid case is excluded from a non-"unpaid" status filter even if its
     * underlying workflow status matches. PDF-mode submissions only match search by ID,
     * since they have no structured dog/owner/vet name fields to search against (see
     * `DogEntry.tsx`'s pdf-mode handling).
     */
    const filtered = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        const matches = submissions.filter((submission) => {
            if (statusFilter !== "all" && getAdminCaseDisplayStatus(submission) !== statusFilter) {
                return false;
            }

            if (!query) return true;

            const idMatch = submission.id?.toLowerCase().includes(query) ?? false;
            if (submission.submissionType === "pdf") return idMatch;

            return (
                idMatch ||
                submission.dog.registeredName.toLowerCase().includes(query) ||
                submission.owner.name.toLowerCase().includes(query) ||
                submission.veterinarian.veterinarianName.toLowerCase().includes(query)
            );
        });

        return matches.sort((a, b) =>
            sortOrder === "newest"
                ? b.createdAt.getTime() - a.createdAt.getTime()
                : a.createdAt.getTime() - b.createdAt.getTime(),
        );
    }, [submissions, searchTerm, statusFilter, sortOrder]);

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
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
            />
        </>
    );
};
