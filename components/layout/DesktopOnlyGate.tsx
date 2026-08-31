"use client";
// dependencies
import Link from "next/link";
// hooks
import { useIsDesktop } from "@/hooks/useIsDesktop";

interface DesktopOnlyGateProps {
    children: React.ReactNode;
}

export const DesktopOnlyGate = ({ children }: DesktopOnlyGateProps) => {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-cream min-h-screen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/svg/logo-regular.svg" alt="" className="w-10 h-10" />
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!isDesktop) {
        return <DesktopOnlyMessage />;
    }

    return <>{children}</>;
};

const DesktopOnlyMessage = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 min-h-screen bg-cream px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/svg/logo-regular.svg" alt="Hayes Hip and Elbow Scoring" className="w-16 h-16" />
        <h1 className="text-xl font-bold text-brand-brown sm:text-2xl">
            Please use a larger screen
        </h1>
        <p className="max-w-sm text-sm text-gray-500 leading-relaxed">
            This page is only available on tablet and desktop screens. Please revisit
            on a device with a wider display to continue.
        </p>
        <Link
            href="/"
            className="text-sm font-medium text-brand-green underline hover:text-[#3d4e36] transition"
        >
            Back to Home
        </Link>
    </div>
);
