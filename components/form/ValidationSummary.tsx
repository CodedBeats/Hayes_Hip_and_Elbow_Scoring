import { ExclamationTriangleIcon } from "../misc/Icons";
import type { ValidationIssue } from "@/types/validation";

export const ValidationSummary = ({ issues }: { issues: ValidationIssue[] }) => {
    if (issues.length === 0) return null;

    // group while preserving first-seen section order
    const grouped = issues.reduce<Record<string, string[]>>((acc, { section, label }) => {
        acc[section] = acc[section] ? [...acc[section], label] : [label];
        return acc;
    }, {});

    return (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-800">
                    Please complete the following before marking this dog complete:
                </p>
            </div>
            <div className="space-y-1 pl-7">
                {Object.entries(grouped).map(([section, labels]) => (
                    <p key={section} className="text-sm text-red-700">
                        <span className="font-medium">{section}:</span> {labels.join(", ")}
                    </p>
                ))}
            </div>
        </div>
    );
};
