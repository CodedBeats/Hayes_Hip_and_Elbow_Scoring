"use client";
// dependencies
import { useState } from "react";
import { useRouter } from "next/navigation";
// lib
import { createSubmission, SAMPLE_TEST_SUBMISSION } from "@/lib/firebase";

export const CreateTestSubmissionButton = () => {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        setSaving(true);
        setError(null);
        try {
            // A fresh ID per click, so repeated presses create distinct docs
            // instead of upserting onto the same one - see SAMPLE_TEST_SUBMISSION.
            await createSubmission(
                { ...SAMPLE_TEST_SUBMISSION, s3SubmissionId: crypto.randomUUID() },
                "testSubmissions",
            );
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create test submission. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                type="button"
                onClick={handleClick}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-brown cursor-pointer transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {saving ? "Creating..." : "Create Test Submission"}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};
