"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
    const params = useSearchParams();

    useEffect(() => {
        const finalise = async () => {
            const sessionId = params.get("session_id");

            if (!sessionId) return;

            const verifyRes = await fetch(
                `/api/verify-payment?session_id=${sessionId}`,
            );

            const verifyData = await verifyRes.json();

            if (!verifyData.paid) {
                alert("Payment not verified");
                return;
            }

            const formData = JSON.parse(
                localStorage.getItem("caseFormData") || "{}",
            );

            const uploadRefs = JSON.parse(
                localStorage.getItem("uploadRefs") || "{}",
            );

            // FINALIZE CASE HERE
            console.log(formData);
            console.log(uploadRefs);

            // create firestore doc here
        };

        finalise();
    }, [params]);

    return <div>Payment successful</div>;
}

export default function SuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    );
}
