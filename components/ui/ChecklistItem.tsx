// components
import { CheckCircleIcon } from "@/components/misc/Icons";


interface ChecklistItemProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export const ChecklistItem = ({ icon, children }: ChecklistItemProps) => (
    <div className="flex items-start gap-2.5">
        {icon ?? <CheckCircleIcon className="mt-0.5 w-5 h-5 text-brand-green flex-shrink-0" />}
        <span className="text-sm text-gray-600 leading-relaxed">{children}</span>
    </div>
);
