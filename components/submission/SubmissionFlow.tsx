// dependencies
"use client";
import { useCallback, useEffect, useState } from "react";
// components
import { DogEntry } from "./DogEntry";
import type { DogDraft } from "./DogEntry";
// lib
import { createSubmission } from "@/lib/firebase";
import { calculatePrice } from "@/lib/pricing";
// types
import type { DogCase } from "@/types/dog";
import type { Files } from "@/types/submission";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { BillingInfo } from "@/types/billing";

// ---- draft persistence ----

const DRAFT_KEY = "submission_draft";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CompletedDogEntry = {
    submissionType: string;
    dog: DogCase;
    files: Files;
    owner: OwnerDetails;
    veterinarian: VeterinarianDetails;
};

type SubmissionDraft = {
    submissionId: string;
    dogCount: number;
    savedAt: number;
    completedDogs: Record<number, CompletedDogEntry>;
    dogDrafts: Record<number, DogDraft>;
};

function loadDraft(): SubmissionDraft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const draft = JSON.parse(raw) as SubmissionDraft;
        if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
            localStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return draft;
    } catch {
        return null;
    }
}

// ---- component ----

export const SubmissionFlow = () => {
    const [savedDraft] = useState<SubmissionDraft | null>(() => loadDraft());

    const [submissionId] = useState(() => savedDraft?.submissionId ?? crypto.randomUUID());
    const [dogCount, setDogCount] = useState(() => savedDraft?.dogCount ?? 1);
    const [completedDogs, setCompletedDogs] = useState<Record<number, CompletedDogEntry>>(
        () => savedDraft?.completedDogs ?? {},
    );
    const [dogDrafts, setDogDrafts] = useState<Record<number, DogDraft>>(
        () => savedDraft?.dogDrafts ?? {},
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // persist to localStorage whenever relevant state changes
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            submissionId, dogCount, savedAt: Date.now(), completedDogs, dogDrafts,
        } satisfies SubmissionDraft));
    }, [submissionId, dogCount, completedDogs, dogDrafts]);

    const handleDogComplete = (
        dogIndex: number,
        submissionType: string,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        veterinarian: VeterinarianDetails,
    ) => {
        setCompletedDogs((prev) => ({ ...prev, [dogIndex]: { submissionType, dog, files, owner, veterinarian } }));
    };

    const handleDraftChange = useCallback((dogIndex: number, draft: DogDraft) => {
        setDogDrafts((prev) => ({ ...prev, [dogIndex]: draft }));
    }, []);

    const handleCountChange = (newCount: number) => {
        if (newCount < 1) return;
        setDogCount(newCount);
        if (newCount < dogCount) {
            setCompletedDogs((prev) => {
                const updated = { ...prev };
                for (let i = newCount + 1; i <= dogCount; i++) delete updated[i];
                return updated;
            });
            setDogDrafts((prev) => {
                const updated = { ...prev };
                for (let i = newCount + 1; i <= dogCount; i++) delete updated[i];
                return updated;
            });
        }
    };

    const completedCount = Object.keys(completedDogs).length;
    const allComplete = completedCount === dogCount;

    const totalAud = Object.values(completedDogs).reduce(
        (sum, { dog }) => sum + calculatePrice(dog.examType, dog.isDogsAustraliaRegistered).total,
        0,
    );

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const docIds = await Promise.all(
                Object.entries(completedDogs).map(([idx, { submissionType, dog, files, owner, veterinarian }]) => {
                    const billing: BillingInfo = {
                        billingType: "payNow",
                        paymentStatus: "unpaid",
                        amount: calculatePrice(dog.examType, dog.isDogsAustraliaRegistered).total,
                    };
                    return createSubmission({
                        s3SubmissionId: submissionId,
                        dogIndex: Number(idx),
                        submissionType,
                        owner,
                        veterinarian,
                        dog,
                        files,
                        billing,
                    });
                }),
            );

            localStorage.setItem("stripe_pending", JSON.stringify({ firestoreDocIds: docIds }));
            localStorage.removeItem(DRAFT_KEY);

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: totalAud * 100 }),
            });
            const data = await res.json();
            if (!data.url) throw new Error("No checkout URL returned");
            window.location.href = data.url;
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Submission failed");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* -- Header -- */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">New Submission</h1>
                    <p className="mt-1 font-mono text-xs text-gray-400">{submissionId}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">Dogs:</span>
                    <button
                        type="button"
                        onClick={() => handleCountChange(dogCount - 1)}
                        disabled={dogCount <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        −
                    </button>
                    <span className="w-5 text-center text-lg font-semibold text-gray-900">{dogCount}</span>
                    <button
                        type="button"
                        onClick={() => handleCountChange(dogCount + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* -- Progress saved notice -- */}
            <p className="mt-2 text-xs text-gray-400">
                Your progress is automatically saved — form fields and uploaded files will be remembered for 7 days if you close or reload this page.
            </p>

            {/* -- Progress -- */}
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>
                    {completedCount} of {dogCount} dog{dogCount > 1 ? "s" : ""} complete
                    {allComplete && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Ready for checkout
                        </span>
                    )}
                </span>
                {completedCount > 0 && (
                    <span className="font-semibold text-gray-900">Total: ${totalAud}</span>
                )}
            </div>

            {/* -- Dog entries - each has its own dog + owner + vet form -- */}
            <div className="mt-8 space-y-6">
                {Array.from({ length: dogCount }, (_, i) => i + 1).map((dogIndex) => (
                    <DogEntry
                        key={dogIndex}
                        submissionId={submissionId}
                        dogIndex={dogIndex}
                        initialDraft={dogDrafts[dogIndex]}
                        onComplete={(submissionType, dog, files, owner, veterinarian) =>
                            handleDogComplete(dogIndex, submissionType, dog, files, owner, veterinarian)
                        }
                        onDraftChange={(draft) => handleDraftChange(dogIndex, draft)}
                    />
                ))}
            </div>

            {/* -- Actions -- */}
            <div className="mt-8 border-t border-gray-200 pt-8">
                {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allComplete || isSubmitting}
                    className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isSubmitting
                        ? "Preparing checkout..."
                        : allComplete
                            ? `Proceed to Checkout — $${totalAud}`
                            : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`}
                </button>
            </div>
        </div>
    );
};
