import Link from "next/link";

const CaseNotFound = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h2 className="text-xl font-bold text-brand-brown">Case not found</h2>
        <p className="text-sm text-gray-500">This case may have been removed or the link may be incorrect.</p>
        <Link
            href="/admin"
            className="text-sm font-medium text-brand-green underline hover:text-[#3d4e36] transition"
        >
            Back to Cases
        </Link>
    </div>
);

export default CaseNotFound;
