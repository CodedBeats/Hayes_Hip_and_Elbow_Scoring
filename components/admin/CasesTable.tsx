"use client";
// dependencies
import { useState } from "react";
import Link from "next/link";
// types
import { type Submission } from "@/types/submission";
// lib
import { getAdminCaseDisplayStatus } from "@/lib/status";
// components
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/misc/Icons";

interface CasesTableProps {
    submissions: Submission[];
    title: string;
    pageSize?: number;
}

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" });

export const CasesTable = ({ submissions, title, pageSize = 4 }: CasesTableProps) => {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize));
    const start = (page - 1) * pageSize;
    const visible = submissions.slice(start, start + pageSize);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-5">
                <h3 className="text-lg font-bold text-brand-brown">{title}</h3>
                <Button variant="outline" size="sm" className="!border-gray-300 !text-brand-brown hover:!bg-gray-50">
                    <FunnelIcon className="h-4 w-4" />
                    Filter
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-y border-gray-200 bg-warm-sand/40 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-6 py-3 font-semibold">Case ID</th>
                            <th className="px-6 py-3 font-semibold">Dog Name</th>
                            <th className="px-6 py-3 font-semibold">Breed</th>
                            <th className="px-6 py-3 font-semibold">Owner</th>
                            <th className="px-6 py-3 font-semibold">Submission Date</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((submission) => (
                            <tr key={submission.id} className="border-b border-gray-100 last:border-b-0">
                                <td className="px-6 py-4 font-bold text-brand-brown">#{submission.id}</td>
                                <td className="px-6 py-4 text-gray-700">
                                    {submission.submissionType === "pdf" ? "N/A — PDF submission" : submission.dog.registeredName}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {submission.submissionType === "pdf" ? "N/A — PDF submission" : submission.dog.breed}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {submission.submissionType === "pdf" ? "N/A — PDF submission" : submission.owner.name}
                                </td>
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

            <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-gray-500">
                    {submissions.length === 0
                        ? "Showing 0 cases"
                        : `Showing ${start + 1} to ${Math.min(start + pageSize, submissions.length)} of ${submissions.length} cases`}
                </p>
                <div className="flex items-center gap-1">
                    <IconButton
                        icon={<ChevronLeftIcon />}
                        ariaLabel="Previous page"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                            key={p}
                            size="sm"
                            variant={p === page ? "solid" : "outline"}
                            className={p === page ? "" : "!border-gray-300 !text-gray-600 hover:!bg-gray-50"}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </Button>
                    ))}
                    <IconButton
                        icon={<ChevronRightIcon />}
                        ariaLabel="Next page"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    />
                </div>
            </div>
        </div>
    );
};
