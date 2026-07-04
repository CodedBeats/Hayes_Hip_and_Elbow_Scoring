import type { SubmissionStatus } from "@/types/submission";

export const statusLabels: Record<SubmissionStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    pendingReview: "Pending Review",
    reviewing: "In Review",
    completed: "Completed",
    archived: "Archived",
};

const statusClasses: Record<SubmissionStatus, string> = {
    draft: "bg-gray-100 text-gray-500",
    submitted: "bg-blue-100 text-blue-700",
    pendingReview: "bg-orange-100 text-orange-700",
    reviewing: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    archived: "bg-gray-200 text-gray-600",
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
