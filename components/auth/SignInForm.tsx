'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightOnRectangleIcon,
} from "@/components/misc/Icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignInForm = () => {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // already signed in - skip the form entirely
    useEffect(() => {
        if (!loading && user) {
            router.replace("/admin");
        }
    }, [loading, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await signIn(trimmedEmail, password);
            router.push("/admin");
        } catch (err) {
            setError(getAuthErrorMessage(err));
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-4 w-full">
                <label className="flex items-center gap-1.5 mb-1.5 text-sm font-medium text-gray-700">
                    <EnvelopeIcon />
                    Email Address
                </label>
                <input
                    type="email"
                    name="email"
                    placeholder="admin@vetscore.com.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                />
            </div>

            <div className="mb-4 w-full">
                <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <LockClosedIcon />
                        Password
                    </label>
                    <span
                        className="text-xs text-brand-brown/60 cursor-not-allowed"
                        title="Not yet available"
                    >
                        Forgot Password?
                    </span>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-green-mid px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6a7b61] disabled:cursor-not-allowed disabled:opacity-40"
            >
                {isSubmitting ? (
                    "Signing in..."
                ) : (
                    <>
                        Secure Sign In <ArrowRightOnRectangleIcon />
                    </>
                )}
            </button>
        </form>
    );
};
