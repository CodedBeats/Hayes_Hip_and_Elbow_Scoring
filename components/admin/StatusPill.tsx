// types
import type { SubmissionStatus } from "@/types/submission";


// constants for status label text
export const statusLabels: Record<SubmissionStatus, string> = {
    unpaid: "Unpaid",
    pendingReview: "Pending Review",
    draft: "Draft",
    reviewing: "In Review",
    completed: "Completed",
};
// constants for status style
const statusClasses: Record<SubmissionStatus, string> = {
    unpaid: "bg-red-100 text-red-700",
    pendingReview: "bg-orange-100 text-orange-700",
    draft: "bg-gray-100 text-gray-500",
    reviewing: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
};


interface StatusPillProps {
    status: SubmissionStatus;
    className?: string;
}

export const StatusPill = ({ status, className = "" }: StatusPillProps) => {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]} ${className}`}
        >
            {statusLabels[status]}
        </span>
    );
};
