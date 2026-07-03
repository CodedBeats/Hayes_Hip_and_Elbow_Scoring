// dependencies
"use client";
import { useRouter } from "next/navigation";
// components

export default function Home() {
    const router = useRouter();

    const handleExitPreview = async () => {
        await fetch("/api/dev-login", { method: "DELETE" });
        router.push("/pre-launch");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-6">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Preview Mode
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            You are currently viewing the application in preview mode.
                        </p>
                    </div>

                    <button
                        onClick={handleExitPreview}
                        className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3d4e36]"
                    >
                        Exit Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
