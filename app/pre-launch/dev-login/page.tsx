"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DevLoginPage = () => {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/dev-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/");
                return;
            }

            setError("Incorrect password.");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F9F7F3] font-[var(--font-plus-jakarta-sans)] px-6">
            <div className="w-full max-w-sm flex flex-col gap-5">
                <h1 className="text-2xl font-bold text-[#3E2B23] text-center">Internal Preview</h1>
                <p className="text-sm text-gray-500 text-center">
                    Enter the preview password to access the site.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-[#506147] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d4e36] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSubmitting ? "Checking..." : "Continue"}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default DevLoginPage;
