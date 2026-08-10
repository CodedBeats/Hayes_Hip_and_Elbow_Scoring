// types
import type { ReactNode } from "react";
// components
import { PenIcon } from "@/components/misc/Icons";


interface FileAssetsCardProps {
    label: string;
    children: ReactNode;
}

export const FileAssetsCard = ({ label, children }: FileAssetsCardProps) => {
    return (
        <div className="w-full rounded-xl border border-gray-200 p-4">
            <p className="flex items-center justify-start gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <PenIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {label}
            </p>

            <div className="mt-3 flex flex-col gap-3">
                {children}
            </div>
        </div>
    );
};
