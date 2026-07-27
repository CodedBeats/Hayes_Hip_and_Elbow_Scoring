// dependencies
"use client";
import { useCallback, useEffect, useState } from "react";
// components
import type { DogDraft } from "@/components/submission/DogEntry";
// lib
import { createSubmission } from "@/lib/firebase";
import { calculatePrice } from "@/lib/pricing";
// types
import type { DogCase } from "@/types/dog";
import type { Files } from "@/types/submission";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { BillingInfo } from "@/types/billing";

const DRAFT_KEY = "submission_draft";

export type CompletedDogEntry = {
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

const loadDraft = (): SubmissionDraft | null => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SubmissionDraft;
    } catch {
        return null;
    }
};

/**
 * Owns the whole-submission draft: dog count, per-dog completion state, per-dog form
 * drafts, localStorage persistence, and final checkout submission.
 *
 * @remarks
 * Extracted out of `SubmissionFlow.tsx`, which stays a pure JSX/orchestration layer.
 * Mirrors {@link useDogFileUpload | useDogFileUpload}'s split for `DogEntry.tsx` -
 * state/handlers live in the hook, rendering stays in the component.
 */
export const useSubmissionDraft = () => {
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

    /**
     * Creates one Firestore submission doc per completed dog, then redirects to Stripe
     * Checkout.
     *
     * @remarks
     * Clears the draft from localStorage right before redirecting - by this point every
     * dog's data is durably in Firestore, so there's nothing left for the draft to
     * recover if the user comes back.
     */
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

    return {
        submissionId,
        dogCount,
        dogDrafts,
        isSubmitting,
        submitError,
        completedCount,
        allComplete,
        totalAud,
        handleDogComplete,
        handleDraftChange,
        handleCountChange,
        handleSubmit,
    };
};
