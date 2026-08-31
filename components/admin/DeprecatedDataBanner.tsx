// components
import { ExclamationTriangleIcon } from "@/components/misc/Icons";

interface DeprecatedDataBannerProps {
    message?: string;
}

export const DeprecatedDataBanner = ({
    message = "This is old test data from development - not a real case. It's kept for reference only and can't be edited or archived.",
}: DeprecatedDataBannerProps) => (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
        <div>
            <p className="text-sm font-bold text-red-700">Deprecated test data</p>
            <p className="mt-0.5 text-sm text-red-600">{message}</p>
        </div>
    </div>
);
