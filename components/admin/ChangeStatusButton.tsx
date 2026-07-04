"use client";

import { useState } from "react";
import type { SubmissionStatus } from "@/types/submission";
import { statusLabels, StatusPill } from "@/components/admin/StatusPill";
import { ChevronDownIcon } from "@/components/misc/Icons";

const allStatuses = Object.keys(statusLabels) as SubmissionStatus[];

interface ChangeStatusButtonProps {
    currentStatus: SubmissionStatus;
}

// Local-only status picker; not yet wired up to Firestore.
export const ChangeStatusButton = ({ currentStatus }: ChangeStatusButtonProps) => {
    const [status, setStatus] = useState(currentStatus);
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-brown transition-colors duration-200 hover:bg-gray-50"
            >
                Change Status
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
                                onClick={() => {
                                    setStatus(option);
                                    setOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                            >
                                <StatusPill status={option} />
                                {option === status && <span className="text-xs text-brand-green-mid">✓</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
