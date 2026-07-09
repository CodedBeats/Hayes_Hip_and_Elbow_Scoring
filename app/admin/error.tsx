"use client";

import { useEffect } from "react";
import { getFirestoreErrorMessage } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";

interface AdminErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// Catches errors thrown by any /admin/* Server Component - getAllSubmissions/
// getSubmissionById/enrichUploadedFile don't swallow their own failures, so a Firestore
// or S3 problem surfaces here instead of a blank/broken page.
const AdminError = ({ error, reset }: AdminErrorProps) => {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getFirestoreErrorMessage(error)}
            </div>
            <Button onClick={reset}>Try again</Button>
        </div>
    );
};

export default AdminError;
