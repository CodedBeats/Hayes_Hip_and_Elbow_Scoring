"use client";
// dependencies
import Link from "next/link";
// components
import { DogEntry } from "./DogEntry";
// hooks
import { useSubmissionDraft } from "@/hooks/useSubmissionDraft";

export const SubmissionFlow = () => {
    const {
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
    } = useSubmissionDraft();

    return (
        <div className="w-full">
            {/* -- Page title -- */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Hayes Hip & Elbow Scoring Submission</h1>
                <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
                    Please complete all sections below to ensure your submission is processed accurately.
                    All DICOM files are reviewed and handled securely.
                </p>
                <p className="mt-2 font-mono text-xs text-gray-400">{submissionId}</p>
                <p className="mt-2 text-sm text-gray-600">
                    Need the official CHED forms or scheme details? See our{" "}
                    <Link href="/about#ched-resources" className="font-semibold text-brand-green underline">
                        CHED Resources
                    </Link>{" "}
                    section.
                </p>
            </div>

            {/* -- Instruction box -- */}
            <div className="mb-6 rounded-xl bg-warm-sand border border-[#C4C8BE] p-5">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-brand-green mb-2">Submission Instructions</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Ensure your DICOM (.dcm) files are clearly labeled with the Dog&apos;s microchip number.</li>
                            <li>• Digital signatures are required for both Owner and Veterinarian when submitting online - PDF submissions should already include both signatures within the uploaded form.</li>
                            <li>• Processing typically takes 3-5 business days from receipt of payment.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* -- Progress + dog counter -- */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        {completedCount} of {dogCount} dog{dogCount > 1 ? "s" : ""} complete
                    </span>
                    {allComplete && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Ready for checkout
                        </span>
                    )}
                    {completedCount > 0 && (
                        <span className="text-sm font-semibold text-gray-900"> ${totalAud} total</span>
                    )}
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-gray-700">Dogs:</span>
                    <button
                        type="button"
                        onClick={() => handleCountChange(dogCount - 1)}
                        disabled={dogCount <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:border-brand-green-mid hover:text-brand-green transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        -
                    </button>
                    <span className="w-5 text-center text-base font-semibold text-gray-900">{dogCount}</span>
                    <button
                        type="button"
                        onClick={() => handleCountChange(dogCount + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:border-brand-green-mid hover:text-brand-green transition"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* -- Progress saved notice -- */}
            <p className="mb-6 text-xs text-gray-400 text-center">
                Your progress is automatically saved - form fields and uploaded files will be remembered if you close or reload this page.
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

            {/* -- Dog entries -- */}
            <div className="space-y-10">
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

            {/* -- Checkout -- */}
            <div className="mt-10 border-t border-gray-200 pt-8">
                {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Secure Encrypted Transaction
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!allComplete || isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3d4e36] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSubmitting
                            ? "Preparing checkout..."
                            : allComplete
                                ? `Proceed to Payment - $${totalAud}`
                                : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`}
                        {!isSubmitting && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
