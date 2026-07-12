"use client";

// dependencies
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// components
import { Sidebar } from "@/components/admin/Sidebar";
import { DesktopOnlyGate } from "@/components/layout/DesktopOnlyGate";
// hook and lib
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <DesktopOnlyGate>
            <div className="min-h-screen bg-cream">
                <Sidebar userEmail={user.email ?? ""} onSignOut={handleSignOut} />
                <main className="ml-64 px-10 py-8">{children}</main>
            </div>
        </DesktopOnlyGate>
    );
}
