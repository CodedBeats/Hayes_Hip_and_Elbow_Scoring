"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase";

export default function AdminDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/auth/sign-in");
        }
    }, [loading, user, router]);

    const handleSignOut = () => {
        signOutUser();
        router.push("/auth/sign-in");
    };

    if (loading || !user) {
        return (
            <div className="flex flex-1 items-center justify-center bg-cream min-h-screen">
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-cream min-h-screen">
            <p className="text-lg text-brand-brown">Hi, {user.email}</p>
            <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2 rounded-md bg-brand-green-mid text-white text-sm font-semibold hover:bg-[#6a7b61] transition-colors duration-200"
            >
                Sign out
            </button>
        </div>
    );
}
