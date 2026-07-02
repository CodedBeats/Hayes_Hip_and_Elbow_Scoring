"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { updateSubmissionPaymentStatus } from "@/lib/firebase";

const SuccessContent = () => {
    const params = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
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

            const pending = localStorage.getItem("stripe_pending");
            if (pending) {
                const { firestoreDocIds } = JSON.parse(pending) as { firestoreDocIds: string[] };
                await Promise.all(firestoreDocIds.map((id) => updateSubmissionPaymentStatus(id, "paid")));
                localStorage.removeItem("stripe_pending");
                localStorage.removeItem("submission_draft");
            }

            setStatus("success");
        };

        finalise();
    }, [params]);

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
