// dependencies
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// components
import type { DogDraft } from "@/components/submission/DogEntry";
// lib
import { createSubmission } from "@/lib/firebase";
import { calculatePrice } from "@/lib/pricing";
// types
import type { DogCase } from "@/types/dog";
import type { Files } from "@/types/submission";
import type { OwnerDetails } from "@/types/owner";
import type { ClinicInfo } from "@/types/clinic";
import type { BillingInfo } from "@/types/billing";

const DRAFT_KEY = "submission_draft";

export type CompletedDogEntry = {
    dog: DogCase;
    files: Files;
    owner: OwnerDetails;
    payer: "owner" | "clinic";
};

type SubmissionDraft = {
    submissionId: string;
    dogCount: number;
    savedAt: number;
    submitterType: "owner" | "clinic";
    clinicInfo: ClinicInfo;
    billingType: "payNow" | "invoice" | "batchMonthly";
    completedDogs: Record<number, CompletedDogEntry>;
    dogDrafts: Record<number, DogDraft>;
};

const EMPTY_CLINIC_INFO: ClinicInfo = { clinicName: "", contactName: "", email: "", phone: "" };

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
 * Owns the whole-submission draft: dog count, submitter/billing choices, per-dog
 * completion state, per-dog form drafts, localStorage persistence, and final checkout
 * submission.
 *
 * @remarks
 * Extracted out of `SubmissionFlow.tsx`, which stays a pure JSX/orchestration layer.
 * Mirrors {@link useDogFileUpload | useDogFileUpload}'s split for `DogEntry.tsx` -
 * state/handlers live in the hook, rendering stays in the component.
 */
export const useSubmissionDraft = () => {
    const router = useRouter();
    const [savedDraft] = useState<SubmissionDraft | null>(() => loadDraft());

    const [submissionId] = useState(() => savedDraft?.submissionId ?? crypto.randomUUID());
    const [dogCount, setDogCount] = useState(() => savedDraft?.dogCount ?? 1);

    // whole-submission choices
    const [submitterType, setSubmitterType] = useState<"owner" | "clinic">(savedDraft?.submitterType ?? "owner");
    const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(savedDraft?.clinicInfo ?? EMPTY_CLINIC_INFO);
    const [billingType, setBillingType] = useState<"payNow" | "invoice" | "batchMonthly">(savedDraft?.billingType ?? "payNow");

    const [completedDogs, setCompletedDogs] = useState<Record<number, CompletedDogEntry>>(
        () => savedDraft?.completedDogs ?? {},
    );
    const [dogDrafts, setDogDrafts] = useState<Record<number, DogDraft>>(
        () => savedDraft?.dogDrafts ?? {},
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // owner submissions are always payNow, regardless of whatever the billingType radio
    // was last set to before submitterType flipped back - derived rather than synced via
    // an effect, since the radio itself is only ever shown for clinic submissions anyway
    const effectiveBillingType = submitterType === "clinic" ? billingType : "payNow";

    // persist to localStorage whenever relevant state changes
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            submissionId, dogCount, savedAt: Date.now(), submitterType, clinicInfo, billingType, completedDogs, dogDrafts,
        } satisfies SubmissionDraft));
    }, [submissionId, dogCount, submitterType, clinicInfo, billingType, completedDogs, dogDrafts]);

    const handleDogComplete = (
        dogIndex: number,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        payer: "owner" | "clinic",
    ) => {
        setCompletedDogs((prev) => ({ ...prev, [dogIndex]: { dog, files, owner, payer } }));
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

    // a clinic paying now can't cleanly charge an owner-billed dog through a single
    // Stripe checkout - see useSubmissionDraft's TSDoc / the submission plan for why
    const conflictingDogIndices = submitterType === "clinic" && effectiveBillingType === "payNow"
        ? Object.entries(completedDogs).filter(([, entry]) => entry.payer === "owner").map(([idx]) => Number(idx))
        : [];
    const hasBillingConflict = conflictingDogIndices.length > 0;

    // Surfaced proactively in the UI (not just on a failed submit attempt) - the
    // checkout button is disabled while this conflict exists, so a click never happens
    // to trigger handleSubmit's own copy of this message.
    const billingConflictMessage = hasBillingConflict
        ? `Dog${conflictingDogIndices.length > 1 ? "s" : ""} ${conflictingDogIndices.join(", ")} ${conflictingDogIndices.length > 1 ? "are" : "is"} billed to the owner, which can't be paid now as part of a clinic submission. ` +
          "Switch payment timing to invoice/batch monthly, or remove that dog and submit it separately."
        : null;

    /**
     * Creates one Firestore submission doc per completed dog, then either redirects to
     * Stripe Checkout (`payNow`) or straight to the success page (`invoice`/
     * `batchMonthly`, which never touch Stripe at all).
     *
     * @remarks
     * Clears the draft from localStorage right before redirecting - by this point every
     * dog's data is durably in Firestore, so there's nothing left for the draft to
     * recover if the user comes back.
     */
    const handleSubmit = async () => {
        if (hasBillingConflict) {
            setSubmitError(billingConflictMessage);
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const docIds = await Promise.all(
                Object.entries(completedDogs).map(([idx, { dog, files, owner, payer }]) => {
                    const billing: BillingInfo = {
                        billingType: effectiveBillingType,
                        paymentStatus: effectiveBillingType === "payNow" ? "unpaid" : "pending",
                        amount: calculatePrice(dog.examType, dog.isDogsAustraliaRegistered).total,
                    };
                    return createSubmission({
                        s3SubmissionId: submissionId,
                        dogIndex: Number(idx),
                        submitterType,
                        clinicInfo: submitterType === "clinic" ? clinicInfo : undefined,
                        payer,
                        owner,
                        dog,
                        files,
                        billing,
                    });
                }),
            );

            if (effectiveBillingType !== "payNow") {
                localStorage.removeItem(DRAFT_KEY);
                router.push("/success?mode=invoice");
                return;
            }

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
        submitterType,
        setSubmitterType,
        clinicInfo,
        setClinicInfo,
        billingType,
        setBillingType,
        effectiveBillingType,
        isSubmitting,
        submitError,
        completedCount,
        allComplete,
        totalAud,
        hasBillingConflict,
        conflictingDogIndices,
        billingConflictMessage,
        handleDogComplete,
        handleDraftChange,
        handleCountChange,
        handleSubmit,
    };
};
