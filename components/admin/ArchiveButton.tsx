"use client";
// dependencies
import { useState } from "react";
import { useRouter } from "next/navigation";
// lib
import { archiveSubmission, restoreSubmission } from "@/lib/firebase";
// components
import { ArchiveBoxIcon } from "@/components/misc/Icons";

interface ArchiveButtonProps {
    submissionId: string;
    isArchived: boolean;
}

export const ArchiveButton = ({ submissionId, isArchived }: ArchiveButtonProps) => {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        const confirmed = window.confirm(
            isArchived
                ? "Restore this case from the archive?"
                : "Archive this case? You can restore it later from the Archive page."
        );
        if (!confirmed) return;

        setSaving(true);
        setError(null);
        try {
            if (isArchived) {
                await restoreSubmission(submissionId);
            } else {
                await archiveSubmission(submissionId);
            }
            // The status pill/archive state next to the case title is rendered by the parent
            // Server Component from Firestore data - refresh() re-runs it with the now-updated
            // doc, rather than trying to mirror the change in local state here.
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update archive status. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={handleClick}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 cursor-pointer transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <ArchiveBoxIcon className="h-4 w-4 text-gray-500" />
                {saving ? "Saving..." : isArchived ? "Restore Case" : "Archive Case"}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};
