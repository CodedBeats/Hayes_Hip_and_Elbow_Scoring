// dependencies
"use client";
import { useState } from "react";
// components
import { DogEntry } from "./DogEntry";
import { StripeCheckoutButton } from "../buttons/StripeCheckoutBtn";
// lib
import { createSubmission } from "@/lib/firebase";
import { calculatePrice } from "@/lib/pricing";
// types
import type { DogCase } from "@/types/dog";
import type { Files } from "@/types/submission";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { BillingInfo } from "@/types/billing";

type CompletedDogEntry = {
    submissionType: string;
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
        submissionType: string,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        veterinarian: VeterinarianDetails,
    ) => {
        setCompletedDogs((prev) => ({ ...prev, [dogIndex]: { submissionType, dog, files, owner, veterinarian } }));
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

    const totalAud = Object.values(completedDogs).reduce(
        (sum, { dog }) => sum + calculatePrice(dog.examType, dog.isDogsAustraliaRegistered).total,
        0,
    );

    // creates one Firestore doc per dog - billing starts as unpaid
    const handleTestSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await Promise.all(
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

    // TEST ONLY — DELETE BEFORE LAUNCH
    const [isTestingStripe, setIsTestingStripe] = useState(false);
    const [testStripeError, setTestStripeError] = useState<string | null>(null);

    const handleTestStripeCheckout = async () => {
        setIsTestingStripe(true);
        setTestStripeError(null);
        try {
            // create a fake firestore doc with obvious test values (no real file uploads)
            const docId = await createSubmission({
                s3SubmissionId: submissionId,
                dogIndex: 1,
                submissionType: "online",
                owner: {
                    name: "Test Owner",
                    email: "test@test.com",
                    phone: "0400000000",
                    address: "1 Test St, Sydney NSW 2000",
                    memberNumber: "DA99999",
                },
                veterinarian: {
                    veterinarianName: "Dr Test Vet",
                    practiceName: "Test Vet Clinic",
                    address: "2 Test St, Sydney NSW 2000",
                    phone: "0200000000",
                    positiveIdentificationSighted: false,
                    certificateOfRegistrationSighted: false,
                },
                dog: {
                    id: crypto.randomUUID(),
                    examType: "hipsAndElbows",
                    isDogsAustraliaRegistered: true,
                    registeredName: "Test Dog",
                    registeredNumber: "DA-TEST-001",
                    microchipNumber: "000000000000000",
                    breed: "Labrador Retriever",
                    sex: "male",
                    dateOfBirth: "2020-01-01",
                    dateOfRadiograph: "2024-06-01",
                },
                files: {
                    dicomFiles: [{ fileName: "test-scan.dcm", key: "test/fake-dicom.dcm", size: 1024, contentType: "application/dicom", uploadedAt: new Date() }],
                    supportingDocuments: [],
                },
                billing: {
                    billingType: "payNow",
                    paymentStatus: "unpaid",
                    amount: 130,
                },
            });

            // save doc id so the success page can mark it paid
            localStorage.setItem("stripe_pending", JSON.stringify({ firestoreDocIds: [docId], amount: 13000 }));

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 13000 }),
            });
            const data = await res.json();
            if (!data.url) throw new Error("No checkout URL returned");
            window.location.href = data.url;
        } catch (err) {
            setTestStripeError(err instanceof Error ? err.message : "Test checkout failed");
            setIsTestingStripe(false);
        }
    };
    // END TEST ONLY


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
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>
                    {completedCount} of {dogCount} dog{dogCount > 1 ? "s" : ""} complete
                    {allComplete && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Ready for checkout
                        </span>
                    )}
                </span>
                <span className="font-semibold text-gray-900">
                    Total: ${totalAud}
                </span>
            </div>

            {/* -- Dog entries - each has its own dog + owner + vet form -- */}
            <div className="mt-8 space-y-6">
                {Array.from({ length: dogCount }, (_, i) => i + 1).map((dogIndex) => (
                    <DogEntry
                        key={dogIndex}
                        submissionId={submissionId}
                        dogIndex={dogIndex}
                        onComplete={(submissionType, dog, files, owner, veterinarian) =>
                            handleDogComplete(dogIndex, submissionType, dog, files, owner, veterinarian)
                        }
                    />
                ))}
            </div>

            {/* -- Actions -- */}
            <div className="mt-8 space-y-3 border-t border-gray-200 pt-8">
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                {/* TEST ONLY — DELETE BEFORE LAUNCH */}
                {testStripeError && <p className="text-sm text-red-600">{testStripeError}</p>}
                <button
                    type="button"
                    onClick={handleTestStripeCheckout}
                    disabled={isTestingStripe}
                    className="w-full rounded-lg border-2 border-dashed border-orange-400 bg-orange-50 px-6 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isTestingStripe ? "Creating test doc & redirecting..." : "TEST: Stripe Checkout ($130 fake dog)"}
                </button>
                {/* END TEST ONLY */}

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
                    amount={totalAud * 100}
                    text={
                        allComplete
                            ? `Proceed to Checkout — $${totalAud}`
                            : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`
                    }
                    onBeforeCheckout={handleBeforeStripeCheckout}
                />
            </div>
        </div>
    );
};
