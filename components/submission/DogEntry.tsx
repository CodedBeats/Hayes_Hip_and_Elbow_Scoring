// dependencies
"use client";
import { useEffect, useState } from "react";
// components
import { DogCompleteSummary } from "./DogCompletedSummary";
import { DogEntryOnlineForm } from "./DogEntryOnlineForm";
import { ValidationSummary } from "../form/ValidationSummary";
// hooks
import { useDogFileUpload, EMPTY_UPLOADED_NAMES } from "@/hooks/useDogFileUpload";
import type { UploadedNames } from "@/hooks/useDogFileUpload";
// types
import type { DogEntryFormData, ExamType } from "@/types/form";
import type { DogCase } from "@/types/dog";
import type { OwnerDetails } from "@/types/owner";
import type { Files } from "@/types/submission";
import type { ValidationIssue } from "@/types/validation";
// lib
import { EXAM_LABELS, calculatePrice } from "@/lib/pricing";
import { validateDogEntry } from "@/lib/validation";

// all serialisable per-dog state - persisted to localStorage by SubmissionFlow
export type DogDraft = {
    dogId: string;
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    payer: "owner" | "clinic";
    uploadedFiles: Files | null;
    uploadedNames: UploadedNames;
    isComplete: boolean;
};

const EMPTY_DOG: DogEntryFormData = {
    examType: "hipsAndElbows",
    isDogsAustraliaRegistered: true,
    registeredName: "",
    registeredNumber: "",
    microchipNumber: "",
    breed: "",
    sex: "male",
    dateOfBirth: "",
};

const EMPTY_OWNER: OwnerDetails = {
    name: "", email: "", phone: "", address: "", memberNumber: "",
};

type Props = {
    submissionId: string;
    dogIndex: number;
    submitterType: "owner" | "clinic";
    initialDraft?: DogDraft;
    onComplete: (
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        payer: "owner" | "clinic",
    ) => void;
    onDraftChange?: (draft: DogDraft) => void;
};

export const DogEntry = ({ submissionId, dogIndex, submitterType, initialDraft, onComplete, onDraftChange }: Props) => {
    const [dogId] = useState(() => initialDraft?.dogId ?? crypto.randomUUID());
    const [dogData, setDogData] = useState<DogEntryFormData>(initialDraft?.dogData ?? EMPTY_DOG);
    const [ownerData, setOwnerData] = useState<OwnerDetails>(initialDraft?.ownerData ?? EMPTY_OWNER);

    // who is being billed for this dog - only relevant/editable when a clinic is submitting
    const [payer, setPayer] = useState<"owner" | "clinic">(initialDraft?.payer ?? "owner");

    // completion state
    const [isComplete, setIsComplete] = useState(initialDraft?.isComplete ?? false);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

    // file selection, upload, and deletion for this dog - see hooks/useDogFileUpload.ts
    const {
        selectedDicom, setSelectedDicom,
        selectedDocs, setSelectedDocs,
        pdfFormFile, setPdfFormFile,
        isUploading,
        uploadError,
        uploadedFiles,
        uploadKey,
        uploadedNames,
        handleUploadAll,
        handleDeleteFile,
    } = useDogFileUpload({
        submissionId,
        dogIndex,
        initialUploadedFiles: initialDraft?.uploadedFiles ?? null,
        initialUploadedNames: initialDraft?.uploadedNames ?? EMPTY_UPLOADED_NAMES,
    });

    // owner-submitted dogs always bill the owner, regardless of whatever the payer radio
    // was last set to before submitterType flipped back - derived rather than synced via
    // an effect, since the radio itself is only ever shown for clinic submissions anyway
    const effectivePayer = submitterType === "clinic" ? payer : "owner";

    // report serialisable state changes to parent for localStorage persistence
    useEffect(() => {
        onDraftChange?.({
            dogId,
            dogData,
            ownerData,
            payer: effectivePayer,
            uploadedFiles,
            uploadedNames,
            isComplete,
        });
    // onDraftChange intentionally omitted - parent callback identity is not meaningful here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dogId, dogData, ownerData, effectivePayer, uploadedFiles, uploadedNames, isComplete]);

    const setDog = (field: keyof DogEntryFormData, value: string | boolean) =>
        setDogData((prev) => ({ ...prev, [field]: value }));

    const setOwner = (field: keyof OwnerDetails, value: string) =>
        setOwnerData((prev) => ({ ...prev, [field]: value }));

    /**
     * Validates the dog entry's required fields/uploads (see `lib/validation.ts`)
     * and, if everything's present, marks the dog complete.
     */
    const handleMarkComplete = () => {
        const issues = validateDogEntry(dogData, ownerData, uploadedFiles);

        if (issues.length > 0) {
            setValidationIssues(issues);
            return;
        }
        setValidationIssues([]);

        const dogCase: DogCase = {
            id: dogId,
            examType: dogData.examType,
            isDogsAustraliaRegistered: dogData.isDogsAustraliaRegistered,
            registeredName: dogData.registeredName,
            registeredNumber: dogData.registeredNumber || undefined,
            microchipNumber: dogData.microchipNumber,
            breed: dogData.breed,
            sex: dogData.sex,
            dateOfBirth: dogData.dateOfBirth,
        };

        setIsComplete(true);
        onComplete(dogCase, uploadedFiles!, ownerData, effectivePayer);
    };

    // completed summary view
    if (isComplete && uploadedFiles) {
        return (
            <DogCompleteSummary
                dogIndex={dogIndex}
                dogData={dogData}
                ownerData={ownerData}
                uploadedFiles={uploadedFiles}
                onEdit={() => {
                    setIsComplete(false);
                }}
            />
        );
    }

    const uploadCount = (pdfFormFile ? 1 : 0) + selectedDicom.length + selectedDocs.length;

    // per-category duplicate filenames, surfaced inline at the relevant upload box
    // rather than flattened into one combined message
    const duplicateDicomNames = selectedDicom.filter((f) => uploadedNames.dicom.includes(f.name)).map((f) => f.name);
    const duplicateDocsNames = selectedDocs.filter((f) => uploadedNames.docs.includes(f.name)).map((f) => f.name);
    const duplicatePdfFormNames = pdfFormFile && uploadedNames.pdfForm.includes(pdfFormFile.name) ? [pdfFormFile.name] : [];

    return (
        <div className="space-y-4">
            {/* -- Dog header: title + exam type -- */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-900">Dog {dogIndex}</h3>
                <div className="flex gap-2">
                    {(["hipsAndElbows", "hipsOnly", "elbowsOnly"] as ExamType[]).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setDog("examType", type)}
                            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                                dogData.examType === type
                                    ? "border-brand-green bg-brand-green text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-brand-green-mid"
                            }`}
                        >
                            {EXAM_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* -- Payer + price card -- */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                {submitterType === "clinic" ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Bill this dog to:</span>
                        <div className="flex gap-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`payer-${dogId}`}
                                    checked={payer === "clinic"}
                                    onChange={() => setPayer("clinic")}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">Clinic</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`payer-${dogId}`}
                                    checked={payer === "owner"}
                                    onChange={() => setPayer("owner")}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">Owner</span>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div />
                )}
                {(() => {
                    const { base, levy, total } = calculatePrice(dogData.examType, dogData.isDogsAustraliaRegistered);
                    return (
                        <div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-900">${base}</span>
                                <span className="mx-1.5 text-gray-400">+</span>
                                <span className="font-medium text-gray-900">${levy} ANKC Levy</span>
                                <span className="mx-1.5 text-gray-400">=</span>
                                <span className="font-semibold text-gray-900">${total}</span>
                                <span className="mx-1.5 font-medium text-gray-600">(total includes a payment processing fee)</span>
                            </p>
                        </div>
                    );
                })()}
            </div>

            {/* -- form sections -- */}
            <DogEntryOnlineForm
                isDogsAustraliaRegistered={dogData.isDogsAustraliaRegistered}
                dogData={dogData}
                ownerData={ownerData}
                setDog={setDog}
                setOwner={setOwner}
                pdfFormFile={pdfFormFile}
                selectedDicom={selectedDicom}
                selectedDocs={selectedDocs}
                onPdfFormChange={setPdfFormFile}
                onDicomChange={setSelectedDicom}
                onDocsChange={setSelectedDocs}
                resetKey={uploadKey}
                uploadedFiles={uploadedFiles}
                duplicatePdfFormNames={duplicatePdfFormNames}
                duplicateDicomNames={duplicateDicomNames}
                duplicateDocsNames={duplicateDocsNames}
                onDeleteFile={handleDeleteFile}
            />

            {/* -- Upload + Mark Complete action card -- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <ValidationSummary issues={validationIssues} />
                <div className="flex justify-between items-end">
                    <div className="h-full flex flex-col align-bottom">
                        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}

                        <div className="h-full flex flex-col flex-wrap items-start gap-4">
                            {uploadedFiles && (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">✓</span>
                                    {uploadedFiles.dicomFiles.length + uploadedFiles.supportingDocuments.length +
                                    (uploadedFiles.pdfForm ? 1 : 0)} files uploaded
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleUploadAll}
                                disabled={isUploading || uploadCount === 0}
                                className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : `Upload Files (${uploadCount})`}
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleMarkComplete}
                        className="ml-auto rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d4e36]"
                    >
                        Mark Dog {dogIndex} Complete
                    </button>
                </div>
            </div>
        </div>
    );
};
