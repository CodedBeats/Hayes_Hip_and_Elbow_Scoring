"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SuccessContent = () => {
    const params = useSearchParams();
    const isInvoiceMode = params.get("mode") === "invoice";

    // Invoice/batch-monthly submissions never go through Stripe - the Firestore docs
    // were already written with paymentStatus "pending" at submission time, so there's
    // nothing to verify or reconcile, and the success state can be set as the initial
    // value rather than via an effect.
    const [status, setStatus] = useState<"loading" | "success" | "error">(() => isInvoiceMode ? "success" : "loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isInvoiceMode) return;

        const finalise = async () => {
            const sessionId = params.get("session_id");
            if (!sessionId) {
                setErrorMessage("No session ID found.");
                setStatus("error");
                return;
            }

            const verifyRes = await fetch(`/api/verify-payment?session_id=${sessionId}`);
            const verifyData = await verifyRes.json();

            if (!verifyData.paid) {
                setErrorMessage("Payment could not be verified.");
                setStatus("error");
                return;
            }

            // The payment-status write now happens server-side (in /api/verify-payment and,
            // as the guaranteed backstop, the Stripe webhook). This page is purely a reader.
            // Payment is confirmed at this point, so the draft is genuinely finished - clear
            // it. stripe_pending is no longer written; the removeItem is left as cleanup for
            // any browser that still carries one from a previous release.
            localStorage.removeItem("submission_draft");
            localStorage.removeItem("stripe_pending");

            setStatus("success");
        };

        finalise();
    }, [params, isInvoiceMode]);

    if (status === "loading") {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-gray-500">Confirming payment...</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
                <p className="text-2xl font-bold text-red-700">Payment Not Confirmed</p>
                <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
            </div>
        );
    }

    if (isInvoiceMode) {
        return (
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
                <p className="text-2xl font-bold text-green-700">Submission Received</p>
                <p className="mt-2 text-sm text-gray-600">You&apos;ll be invoiced separately - no payment is needed right now.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
            <p className="text-2xl font-bold text-green-700">Payment Successful</p>
            <p className="mt-2 text-sm text-gray-600">Your submission has been received and payment confirmed.</p>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    );
}
