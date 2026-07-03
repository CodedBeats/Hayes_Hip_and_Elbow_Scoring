"use client";

import { SignInForm } from "@/components/auth/SignInForm";
import { ShieldCheckIcon } from "@/components/misc/Icons";

export default function AdminSignInPage() {
    return (
        <div className="flex flex-1 flex-col items-center bg-cream font-sans px-6 py-16">
            <div className="w-14 h-14 rounded-full bg-brand-green-mid/20 flex items-center justify-center mb-4">
                <ShieldCheckIcon />
            </div>
            <h1 className="text-3xl font-bold text-brand-brown mb-1">Admin Login</h1>
            <p className="text-sm text-gray-500 mb-8">Hayes Hip &amp; Elbow Scoring</p>

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <SignInForm />
                <hr className="my-6 border-gray-100" />
                <p className="text-xs italic text-gray-400 text-center">
                    Access is restricted to authorised veterinary specialists and administrative staff.
                </p>
            </div>

            <p className="text-xs text-gray-400 mt-8">© 2026 - Hayes Hip &amp; Elbow Scoring</p>
        </div>
    );
}
