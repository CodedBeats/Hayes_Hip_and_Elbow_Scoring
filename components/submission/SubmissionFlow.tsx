// dependencies
"use client";
import { useState } from "react";
// components
import { DogEntry } from "./DogEntry";
import { StripeCheckoutButton } from "../buttons/StripeCheckoutBtn";
// types
import type { DogCase } from "@/types/dog";


export const SubmissionFlow = () => {
    const [submissionId] = useState(() => crypto.randomUUID());
    const [dogCount, setDogCount] = useState(1);
    const [completedDogs, setCompletedDogs] = useState<Record<number, DogCase>>({});

    const handleDogComplete = (dogIndex: number, dog: DogCase) => {
        setCompletedDogs((prev) => ({ ...prev, [dogIndex]: dog }));
    };

    const handleCountChange = (newCount: number) => {
        if (newCount < 1) return;
        setDogCount(newCount);

        // drop completions for dogs that no longer exist
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

    // store submission in local storage since stripe redirects to their payment thingy
    const handleCheckout = () => {
        localStorage.setItem(
            "submission",
            JSON.stringify({ submissionId, dogs: Object.values(completedDogs) }),
        );
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
                        -
                    </button>
                    <span className="w-5 text-center text-lg font-semibold text-gray-900">
                        {dogCount}
                    </span>
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
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span>{completedCount} of {dogCount} dogs complete</span>
                {allComplete && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Ready for checkout
                    </span>
                )}
            </div>

            {/* -- Dog entries -- */}
            <div className="mt-8 space-y-6">
                {Array.from({ length: dogCount }, (_, i) => i + 1).map((dogIndex) => (
                    <DogEntry
                        key={dogIndex}
                        submissionId={submissionId}
                        dogIndex={dogIndex}
                        onComplete={(dog) => handleDogComplete(dogIndex, dog)}
                    />
                ))}
            </div>

            {/* -- Checkout -- */}
            <div className="mt-10 border-t border-gray-200 pt-8">
                <StripeCheckoutButton
                    disabled={!allComplete}
                    text={
                        allComplete
                            ? "Proceed to Checkout"
                            : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`
                    }
                    onBeforeCheckout={handleCheckout}
                />
            </div>
        </div>
    );
};
