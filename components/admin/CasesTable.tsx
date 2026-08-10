"use client";
// dependencies
import { useState } from "react";
import Link from "next/link";
// types
import { type Submission, type SubmissionStatus, type CaseSubmissionSortOrder } from "@/types/submission";
// lib
import { getAdminCaseDisplayStatus } from "@/lib/status";
// components
import { StatusPill, statusLabels } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/Button";
import { FunnelIcon } from "@/components/misc/Icons";

interface CasesTableProps {
    submissions: Submission[];
    title: string;
    pageSize?: number;
    statusFilter: SubmissionStatus | "all";
    onStatusFilterChange: (status: SubmissionStatus | "all") => void;
    availableStatuses: SubmissionStatus[];
    sortOrder: CaseSubmissionSortOrder;
    onSortOrderChange: (order: CaseSubmissionSortOrder) => void;
}

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" });

export const CasesTable = ({
    submissions,
    title,
    pageSize = 4,
    statusFilter,
    onStatusFilterChange,
    availableStatuses,
    sortOrder,
    onSortOrderChange,
}: CasesTableProps) => {
    const [visibleCount, setVisibleCount] = useState(pageSize);

    // A new (e.g. searched/filtered) submissions array should always restart the
    // Load More count rather than keep whatever was previously scrolled through
    const [prevSubmissions, setPrevSubmissions] = useState(submissions);
    if (prevSubmissions !== submissions) {
        setPrevSubmissions(submissions);
        setVisibleCount(pageSize);
    }

    const visible = submissions.slice(0, visibleCount);
    const hasMore = visibleCount < submissions.length;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-5">
                <div>
                    <h3 className="text-lg font-bold text-brand-brown">{title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {submissions.length === 0
                            ? "Showing 0 cases"
                            : `Showing ${visible.length} of ${submissions.length} cases`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={sortOrder}
                        onChange={(e) => onSortOrderChange(e.target.value as CaseSubmissionSortOrder)}
                        aria-label="Sort by submission date"
                        className="appearance-none rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-brand-brown hover:bg-gray-50 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <div className="relative">
                        <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusFilterChange(e.target.value as SubmissionStatus | "all")}
                            aria-label="Filter by status"
                            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm font-medium text-brand-brown hover:bg-gray-50 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        >
                            <option value="all">All Statuses</option>
                            {availableStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabels[status]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-y border-gray-200 bg-warm-sand/40 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-6 py-3 font-semibold">Dog Name</th>
                            <th className="px-6 py-3 font-semibold">Breed</th>
                            <th className="px-6 py-3 font-semibold">Owner</th>
                            <th className="px-6 py-3 font-semibold">Submitter Type</th>
                            <th className="px-6 py-3 font-semibold">Payer</th>
                            <th className="px-6 py-3 font-semibold">Billing Type</th>
                            <th className="px-6 py-3 font-semibold">Submission Date</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((submission) => (
                            <tr key={submission.id} className="border-b border-gray-100 last:border-b-0">
                                <td className="px-6 py-4 text-gray-700">{submission.dog.registeredName}</td>
                                <td className="px-6 py-4 text-gray-700">{submission.dog.breed}</td>
                                <td className="px-6 py-4 text-gray-700">{submission.owner.name}</td>
                                <td className="px-6 py-4 text-gray-700">{submission.submitterType}</td>
                                <td className="px-6 py-4 text-gray-700">{submission.payer}</td>
                                <td className="px-6 py-4 text-gray-700">{submission.billing.billingType}</td>
                                <td className="px-6 py-4 text-gray-700">{formatDate(submission.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <StatusPill status={getAdminCaseDisplayStatus(submission)} />
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/admin/cases/${submission.id}`}
                                        className="text-sm font-medium text-brand-green underline hover:text-[#3d4e36] transition"
                                    >
                                        View Case
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                                    No cases to show.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="flex justify-center px-6 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="!border-gray-300 !text-brand-brown cursor-pointer hover:bg-gray-300!"
                        onClick={() => setVisibleCount((count) => count + pageSize)}
                    >
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
};
