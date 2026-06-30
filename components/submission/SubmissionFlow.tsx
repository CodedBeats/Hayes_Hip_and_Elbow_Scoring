// dependencies
"use client";
import { useState } from "react";
// components
import { DogEntry } from "./DogEntry";
import { StripeCheckoutButton } from "../buttons/StripeCheckoutBtn";
// lib
import { createSubmission } from "@/lib/firebase";
// types
import type { DogCase } from "@/types/dog";
import type { Files } from "@/types/submission";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { BillingInfo } from "@/types/billing";

type CompletedDogEntry = {
    dog: DogCase;
    files: Files;
    owner: OwnerDetails;
    veterinarian: VeterinarianDetails;
};

export const SubmissionFlow = () => {
    const [submissionId] = useState(() => crypto.randomUUID());
    const [dogCount, setDogCount] = useState(1);
    const [completedDogs, setCompletedDogs] = useState<Record<number, CompletedDogEntry>>({});

    // submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleDogComplete = (
        dogIndex: number,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        veterinarian: VeterinarianDetails,
    ) => {
        setCompletedDogs((prev) => ({ ...prev, [dogIndex]: { dog, files, owner, veterinarian } }));
    };

    const handleCountChange = (newCount: number) => {
        if (newCount < 1) return;
        setDogCount(newCount);
        if (newCount < dogCount) {
            setCompletedDogs((prev) => {
                const updated = { ...prev };
                for (let i = newCount + 1; i <= dogCount; i++) delete updated[i];
                return updated;
            });
        }
    };

    const completedCount = Object.keys(completedDogs).length;
    const allComplete = completedCount === dogCount;

    // creates one Firestore doc per dog - billing starts as unpaid
    const handleTestSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const billing: BillingInfo = { billingType: "payNow", paymentStatus: "unpaid", amount: 0 };
            await Promise.all(
                Object.entries(completedDogs).map(([idx, { dog, files, owner, veterinarian }]) =>
                    createSubmission({
                        s3SubmissionId: submissionId,
                        dogIndex: Number(idx),
                        owner,
                        veterinarian,
                        dog,
                        files,
                        billing,
                    }),
                ),
            );
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBeforeStripeCheckout = () => {
        localStorage.setItem(
            "submission",
            JSON.stringify({ submissionId, dogs: Object.values(completedDogs) }),
        );
    };


    // successful everything, yayyy
    if (submitSuccess) {
        return (
            <div className="w-full rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
                <p className="text-2xl font-bold text-green-700">Submission Saved</p>
                <p className="mt-2 font-mono text-xs text-gray-400">{submissionId}</p>
                <p className="mt-4 text-sm text-gray-600">
                    {dogCount} submission{dogCount > 1 ? "s" : ""} written to Firestore.
                    Payment status: <span className="font-semibold">unpaid</span>.
                </p>
            </div>
        );
    }

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

            {/* -- Progress -- */}
            <div className="mt-3 text-sm text-gray-500">
                {completedCount} of {dogCount} dog{dogCount > 1 ? "s" : ""} complete
                {allComplete && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Ready for checkout
                    </span>
                )}
            </div>

            {/* -- Dog entries - each has its own dog + owner + vet form -- */}
            <div className="mt-8 space-y-6">
                {Array.from({ length: dogCount }, (_, i) => i + 1).map((dogIndex) => (
                    <DogEntry
                        key={dogIndex}
                        submissionId={submissionId}
                        dogIndex={dogIndex}
                        onComplete={(dog, files, owner, veterinarian) =>
                            handleDogComplete(dogIndex, dog, files, owner, veterinarian)
                        }
                    />
                ))}
            </div>

            {/* -- Actions -- */}
            <div className="mt-8 space-y-3 border-t border-gray-200 pt-8">
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                {/* Test bypass - skips Stripe, writes to Firestore with paymentStatus: "unpaid" */}
                <button
                    type="button"
                    onClick={handleTestSubmit}
                    disabled={!allComplete || isSubmitting}
                    className="w-full rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isSubmitting ? "Saving to Firestore..." : "Test - Submit Without Payment"}
                </button>

                {/* real payment - TODO: wire up Stripe webhook to call updateSubmissionPaymentStatus */}
                <StripeCheckoutButton
                    disabled={!allComplete}
                    text={
                        allComplete
                            ? "Proceed to Checkout"
                            : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`
                    }
                    onBeforeCheckout={handleBeforeStripeCheckout}
                />
            </div>
        </div>
    );
};
