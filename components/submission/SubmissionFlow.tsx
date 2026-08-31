"use client";
// dependencies
import Link from "next/link";
// components
import { DogEntry } from "./DogEntry";
import { ArrowDownTrayIcon } from "@/components/misc/Icons";
// hooks
import { useSubmissionDraft } from "@/hooks/useSubmissionDraft";
import { useAuth } from "@/hooks/useAuth";

export const SubmissionFlow = () => {
    const { user: adminUser } = useAuth();
    const {
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
        hasOwnerBilledDog,
        handleDogComplete,
        handleDraftChange,
        handleCountChange,
        handleSubmit,
    } = useSubmissionDraft();

    return (
        <div className="w-full">
            {/* -- Page title -- */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hayes Hip & Elbow Scoring Submission
                </h1>
                <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
                    Please complete all sections below to ensure your submission
                    is processed accurately. All DICOM files are reviewed and
                    handled securely.
                </p>
                <p className="mt-2 font-mono text-xs text-gray-400">
                    {submissionId}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                    Need the official CHED scheme details? See our{" "}
                    <Link
                        href="/about#ched-resources"
                        className="font-semibold text-brand-green underline"
                    >
                        CHED Resources
                    </Link>{" "}
                    section.
                </p>
                {/* download PDFs directly */}
                <p className="mt-4 text-sm text-gray-600">
                    Download the official CHED submission form below, matching your dog&apos;s Dogs Australia registration status.
                </p>
                <div className="mt-2 flex justify-center gap-3">
                    <a
                        href="/pdfs/DA%20CHEDS%20Submission%20Form.pdf"
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-brand-green-mid"
                    >
                        <ArrowDownTrayIcon />
                        DA Registered Form
                    </a>
                    <a
                        href="/pdfs/Non%20DA%20CHEDS%20Submission%20Form.pdf"
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-brand-green-mid"
                    >
                        <ArrowDownTrayIcon />
                        Non-DA Registered Form
                    </a>
                </div>
            </div>

            {/* -- Instruction box -- */}
            <div className="mb-6 rounded-xl bg-warm-sand border border-[#C4C8BE] p-5">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-brand-green mb-2">
                            Submission Instructions
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>
                                • Ensure your DICOM (.dcm) files are clearly
                                labeled with the Dog&apos;s microchip number.
                            </li>
                            <li>
                                • Upload the completed & signed PDF submission
                                form for each dog.
                            </li>
                            <li>
                                • Processing typically takes 3-10 business days
                                from receipt of payment.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* -- Who is submitting -- */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-medium text-gray-700">
                    Who is submitting?
                </p>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="submitterType"
                            checked={submitterType === "owner"}
                            onChange={() => setSubmitterType("owner")}
                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                        />
                        <span className="text-sm text-gray-700">Owner</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="submitterType"
                            checked={submitterType === "clinic"}
                            onChange={() => setSubmitterType("clinic")}
                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                        />
                        <span className="text-sm text-gray-700">Clinic</span>
                    </label>
                </div>

                {submitterType === "clinic" && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Clinic Name"
                            value={clinicInfo.clinicName}
                            onChange={(e) =>
                                setClinicInfo({
                                    ...clinicInfo,
                                    clinicName: e.target.value,
                                })
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        />
                        <input
                            type="text"
                            placeholder="Contact Name"
                            value={clinicInfo.contactName}
                            onChange={(e) =>
                                setClinicInfo({
                                    ...clinicInfo,
                                    contactName: e.target.value,
                                })
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        />
                        <input
                            type="email"
                            placeholder="Clinic Email"
                            value={clinicInfo.email}
                            onChange={(e) =>
                                setClinicInfo({
                                    ...clinicInfo,
                                    email: e.target.value,
                                })
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        />
                        <input
                            type="tel"
                            placeholder="Clinic Phone"
                            value={clinicInfo.phone}
                            onChange={(e) =>
                                setClinicInfo({
                                    ...clinicInfo,
                                    phone: e.target.value,
                                })
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        />
                    </div>
                )}
            </div>

            {/* -- Progress + dog counter -- */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        {completedCount} of {dogCount} dog
                        {dogCount > 1 ? "s" : ""} complete
                    </span>
                    {allComplete && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Ready for checkout
                        </span>
                    )}
                    {completedCount > 0 && (
                        <span className="text-sm font-semibold text-gray-900">
                            {" "}
                            ${totalAud} total
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-gray-700">
                        Dogs:
                    </span>
                    <button
                        type="button"
                        onClick={() => handleCountChange(dogCount - 1)}
                        disabled={dogCount <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:border-brand-green-mid hover:text-brand-green transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        -
                    </button>
                    <span className="w-5 text-center text-base font-semibold text-gray-900">
                        {dogCount}
                    </span>
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
                Your progress is automatically saved - form fields and uploaded
                files will be remembered if you close or reload this page.
            </p>

            {/* -- Progress -- */}
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>
                    {completedCount} of {dogCount} dog{dogCount > 1 ? "s" : ""}{" "}
                    complete
                    {allComplete && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Ready for checkout
                        </span>
                    )}
                </span>
                {completedCount > 0 && (
                    <span className="font-semibold text-gray-900">
                        Total: ${totalAud}
                    </span>
                )}
            </div>

            {/* -- Dog entries -- */}
            <div className="space-y-10">
                {Array.from({ length: dogCount }, (_, i) => i + 1).map(
                    (dogIndex) => (
                        <DogEntry
                            key={dogIndex}
                            submissionId={submissionId}
                            dogIndex={dogIndex}
                            submitterType={submitterType}
                            initialDraft={dogDrafts[dogIndex]}
                            onComplete={(dog, files, owner, payer) =>
                                handleDogComplete(
                                    dogIndex,
                                    dog,
                                    files,
                                    owner,
                                    payer,
                                )
                            }
                            onDraftChange={(draft) =>
                                handleDraftChange(dogIndex, draft)
                            }
                        />
                    ),
                )}
            </div>

            {/* -- Checkout -- */}
            <div className="mt-10 border-t border-gray-200 pt-8">
                {submitterType === "clinic" && (
                    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        {hasOwnerBilledDog ? (
                            <p className="text-sm text-gray-700">
                                This submission will be invoiced rather than
                                paid now, because at least one dog is billed
                                to its owner.
                            </p>
                        ) : (
                            <>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    When would you like to pay?
                                </p>
                                <div className="flex flex-wrap gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="billingType"
                                            checked={billingType === "payNow"}
                                            onChange={() => setBillingType("payNow")}
                                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Pay now
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="billingType"
                                            checked={billingType === "invoice"}
                                            onChange={() => setBillingType("invoice")}
                                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Invoice
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="billingType"
                                            checked={billingType === "batchMonthly"}
                                            onChange={() =>
                                                setBillingType("batchMonthly")
                                            }
                                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Batch monthly
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {submitError && (
                    <p className="mb-3 text-sm text-red-600">{submitError}</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                        Secure Encrypted Transaction
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Staff-only: submits through the same real Stripe Checkout flow,
                            but scaled to Stripe's enforced minimum charge instead of the
                            real price - lets an admin exercise the full live submission
                            pipeline without a real charge. Visibility here is just UX; the
                            actual auth check happens server-side in
                            /api/create-checkout-session. */}
                        {adminUser && (
                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={!allComplete || isSubmitting}
                                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Admin Test Submit (no charge)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={
                                !allComplete || isSubmitting
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3d4e36] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isSubmitting
                                ? "Preparing checkout..."
                                : allComplete
                                  ? effectiveBillingType === "payNow"
                                      ? `Proceed to Payment - $${totalAud}`
                                      : "Submit for Invoicing"
                                  : `Complete all ${dogCount} dog${dogCount > 1 ? "s" : ""} to continue`}
                            {!isSubmitting && (
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
