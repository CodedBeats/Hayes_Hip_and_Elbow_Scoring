"use client";
// dependencies
import { useState } from "react";
import { useRouter } from "next/navigation";
// types
import type { SubmissionStatus } from "@/types/submission";
// lib
import { updateSubmissionStatus } from "@/lib/firebase";
// components
import { statusLabels, StatusPill } from "@/components/admin/StatusPill";
import { ChevronDownIcon } from "@/components/misc/Icons";

// "unpaid" is a derived display status, not one admins set directly - exclude it here.
const allStatuses = (Object.keys(statusLabels) as SubmissionStatus[]).filter((status) => status !== "unpaid");

interface ChangeStatusButtonProps {
    submissionId: string;
    currentStatus: SubmissionStatus;
}

export const ChangeStatusButton = ({ submissionId, currentStatus }: ChangeStatusButtonProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = async (status: SubmissionStatus) => {
        setOpen(false);
        if (status === currentStatus) return;

        setSaving(true);
        setError(null);
        try {
            await updateSubmissionStatus(submissionId, status);
            // The status pill next to the case title is rendered by the parent Server
            // Component from Firestore data - refresh() re-runs it with the now-updated
            // doc, rather than trying to mirror the change in local state here.
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update status. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-brown cursor-pointer transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Change Status"}
                    <ChevronDownIcon className="h-4 w-4 text-brand-brown" />
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {allStatuses.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                                >
                                    <StatusPill status={option} />
                                    {option === currentStatus && (
                                        <span className="text-xs text-brand-green-mid">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};
