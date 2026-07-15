// dependencies
"use client";
import { useEffect, useState } from "react";
// components
import { DogCompleteSummary } from "./DogCompletedSummary";
import { DogEntryOnlineForm } from "./DogEntryOnlineForm";
import { DogEntryPdfForm } from "./DogEntryPdfForm";
// types
import type { DogEntryFormData, ExamType } from "@/types/form";
import type { DogCase } from "@/types/dog";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { Files } from "@/types/submission";
import type { UploadedFile, UploadUrlResponse } from "@/types/upload";
// lib
import { EXAM_LABELS, calculatePrice } from "@/lib/pricing";

// all serialisable per-dog state - persisted to localStorage by SubmissionFlow
export type DogDraft = {
    dogId: string;
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    vetData: VeterinarianDetails;
    submissionType: "online" | "pdf";
    uploadedFiles: Files | null;
    uploadedNames: { dicom: string[]; docs: string[]; pdfForm: string[]; ownerSig: string[]; vetSig: string[] };
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
    dateOfRadiograph: "",
};

const EMPTY_OWNER: OwnerDetails = {
    name: "", email: "", phone: "", address: "", memberNumber: "",
};

const EMPTY_VET: VeterinarianDetails = {
    veterinarianName: "", practiceName: "", address: "", phone: "",
    positiveIdentificationSighted: false, certificateOfRegistrationSighted: false,
};

const EMPTY_UPLOADED_NAMES = {
    dicom: [] as string[], docs: [] as string[], pdfForm: [] as string[],
    ownerSig: [] as string[], vetSig: [] as string[],
};

type Props = {
    submissionId: string;
    dogIndex: number;
    initialDraft?: DogDraft;
    onComplete: (
        submissionType: string,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        veterinarian: VeterinarianDetails,
    ) => void;
    onDraftChange?: (draft: DogDraft) => void;
};

export const DogEntry = ({ submissionId, dogIndex, initialDraft, onComplete, onDraftChange }: Props) => {
    const [dogId] = useState(() => initialDraft?.dogId ?? crypto.randomUUID());
    const [dogData, setDogData] = useState<DogEntryFormData>(initialDraft?.dogData ?? EMPTY_DOG);
    const [ownerData, setOwnerData] = useState<OwnerDetails>(initialDraft?.ownerData ?? EMPTY_OWNER);
    const [vetData, setVetData] = useState<VeterinarianDetails>(initialDraft?.vetData ?? EMPTY_VET);

    // file objects
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [ownerSigFile, setOwnerSigFile] = useState<File | null>(null);
    const [vetSigFile, setVetSigFile] = useState<File | null>(null);
    const [pdfFormFile, setPdfFormFile] = useState<File | null>(null);

    // upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Files | null>(initialDraft?.uploadedFiles ?? null);
    const [uploadKey, setUploadKey] = useState(0);
    const [uploadedNames, setUploadedNames] = useState(initialDraft?.uploadedNames ?? EMPTY_UPLOADED_NAMES);

    // mode toggles
    const [submissionType, setSubmissionType] = useState<"online" | "pdf">(initialDraft?.submissionType ?? "online");

    // completion state
    const [isComplete, setIsComplete] = useState(initialDraft?.isComplete ?? false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // report serialisable state changes to parent for localStorage persistence
    useEffect(() => {
        onDraftChange?.({
            dogId,
            dogData,
            ownerData,
            vetData,
            submissionType,
            uploadedFiles,
            uploadedNames,
            isComplete,
        });
    // onDraftChange intentionally omitted - parent callback identity is not meaningful here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dogId, dogData, ownerData, vetData, submissionType, uploadedFiles, uploadedNames, isComplete]);

    const setDog = (field: keyof DogEntryFormData, value: string | boolean) =>
        setDogData((prev) => ({ ...prev, [field]: value }));

    const setOwner = (field: keyof OwnerDetails, value: string) =>
        setOwnerData((prev) => ({ ...prev, [field]: value }));

    const setVet = (field: keyof VeterinarianDetails, value: string | boolean) =>
        setVetData((prev) => ({ ...prev, [field]: value }));

    const handleUploadAll = async () => {
        const signatureFiles = [ownerSigFile, vetSigFile].filter(Boolean) as File[];

        // build ordered file arrays per mode so results can be sliced back cleanly
        const orderedFiles: File[] = submissionType === "pdf"
            ? [
                ...(pdfFormFile ? [pdfFormFile] : []),
                ...selectedDicom,
                ...selectedDocs,
                ...signatureFiles,
            ]
            : [...selectedDicom, ...selectedDocs, ...signatureFiles];

        if (orderedFiles.length === 0) {
            setUploadError("Select at least one file before uploading.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        // there is no AI, I am the AI, and I aM aLIvE!!!!
        // i think when propted, therefore I am only when observed, like the light slit experiment
        // pls work pls work pls work pls work pls work pls work pls work pls work pls work
        try {
            const fileRequests = submissionType === "pdf"
                ? [
                    ...(pdfFormFile ? [{ fileName: pdfFormFile.name, contentType: pdfFormFile.type || "application/pdf", dogIndex, category: "pdf-forms" as const }] : []),
                    ...selectedDicom.map((f) => ({ fileName: f.name, contentType: f.type || "application/dicom", dogIndex, category: "dicom" as const })),
                    ...selectedDocs.map((f) => ({ fileName: f.name, contentType: f.type || "application/pdf", dogIndex, category: "supporting-documents" as const })),
                    ...signatureFiles.map((f) => ({ fileName: f.name, contentType: f.type || "image/png", dogIndex, category: "signatures" as const })),
                ]
                : [
                    ...selectedDicom.map((f) => ({ fileName: f.name, contentType: f.type || "application/dicom", dogIndex, category: "dicom" as const })),
                    ...selectedDocs.map((f) => ({ fileName: f.name, contentType: f.type || "application/pdf", dogIndex, category: "supporting-documents" as const })),
                    ...signatureFiles.map((f) => ({ fileName: f.name, contentType: f.type || "image/png", dogIndex, category: "signatures" as const })),
                ];

            const urlRes = await fetch("/api/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, files: fileRequests }),
            });

            if (!urlRes.ok) {
                const body = await urlRes.json();
                throw new Error(body.errors?.join(", ") ?? body.error ?? "Failed to get upload URLs");
            }

            const { urls }: UploadUrlResponse = await urlRes.json();

            const results = await Promise.all(
                orderedFiles.map((file, i) =>
                    new Promise<UploadedFile>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", urls[i].uploadUrl);
                        xhr.setRequestHeader("Content-Type", file.type);
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve({
                                    fileName: file.name,
                                    key: urls[i].key,
                                    size: file.size,
                                    contentType: file.type,
                                    uploadedAt: new Date(),
                                });
                            } else {
                                reject(new Error(`Upload failed for ${file.name}`));
                            }
                        };
                        xhr.onerror = () => reject(new Error(`Upload failed for ${file.name}`));
                        xhr.send(file);
                    }),
                ),
            );

            // slice results back into the Files shape using known counts
            let cursor = 0;
            const pdfOffset = submissionType === "pdf" && pdfFormFile ? 1 : 0;
            const pdfFormResult = pdfOffset ? results[0] : undefined;
            cursor += pdfOffset;

            const dicomCount = selectedDicom.length;
            const docsCount = selectedDocs.length;

            const dogFiles: Files = {
                pdfForm: pdfFormResult,
                dicomFiles: results.slice(cursor, cursor + dicomCount),
                supportingDocuments: results.slice(cursor + dicomCount, cursor + dicomCount + docsCount),
                ownerSignature: ownerSigFile ? results[cursor + dicomCount + docsCount] : undefined,
                veterinarianSignature: vetSigFile
                    ? results[cursor + dicomCount + docsCount + (ownerSigFile ? 1 : 0)]
                    : undefined,
            };
            setUploadedFiles(prev => ({
                pdfForm: dogFiles.pdfForm ?? prev?.pdfForm,
                dicomFiles: [...(prev?.dicomFiles ?? []), ...dogFiles.dicomFiles],
                supportingDocuments: [...(prev?.supportingDocuments ?? []), ...dogFiles.supportingDocuments],
                ownerSignature: dogFiles.ownerSignature ?? prev?.ownerSignature,
                veterinarianSignature: dogFiles.veterinarianSignature ?? prev?.veterinarianSignature,
            }));
            setUploadedNames((prev) => ({
                dicom:    [...prev.dicom,    ...selectedDicom.map((f) => f.name)],
                docs:     [...prev.docs,     ...selectedDocs.map((f) => f.name)],
                pdfForm:  [...prev.pdfForm,  ...(pdfFormFile ? [pdfFormFile.name] : [])],
                ownerSig: [...prev.ownerSig, ...(ownerSigFile ? [ownerSigFile.name] : [])],
                vetSig:   [...prev.vetSig,   ...(vetSigFile ? [vetSigFile.name] : [])],
            }));
            setSelectedDicom([]);
            setSelectedDocs([]);
            setOwnerSigFile(null);
            setVetSigFile(null);
            setPdfFormFile(null);
            setUploadKey((k) => k + 1);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMarkComplete = () => {
        setValidationError(null);

        // validate dog entry form before marked as complete
        if (submissionType === "pdf") {
            if (!uploadedFiles || !uploadedFiles.pdfForm) {
                setValidationError("Please upload the PDF submission form before completing.");
                return;
            }
            if (uploadedFiles.dicomFiles.length === 0) {
                setValidationError("Please upload at least one DICOM file before completing.");
                return;
            }
            // supporting document only required when Not DA Registered
            if (!dogData.isDogsAustraliaRegistered && uploadedFiles.supportingDocuments.length === 0) {
                setValidationError("Please upload a registration certificate or other document confirming dog's details, including date of birth, sex, and microchip number.");
                return;
            }
        } else {
            // dog
            if (!dogData.registeredName || !dogData.microchipNumber || !dogData.breed ||
                !dogData.dateOfBirth || !dogData.sex) {
                setValidationError("Please fill in all required dog fields.");
                return;
            }
            // owner
            if (!ownerData.name || !ownerData.email || !ownerData.phone) {
                setValidationError("Please fill in all required owner fields.");
                return;
            }
            // vet
            if (!vetData.veterinarianName || !vetData.practiceName || !vetData.phone || !dogData.dateOfRadiograph) {
                setValidationError("Please fill in all required veterinarian fields.");
                return;
            }
            // dicom
            if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) {
                setValidationError("Please upload at least one DICOM file.");
                return;
            }
            // owner and vet signatures
            if (!uploadedFiles.ownerSignature || !uploadedFiles.veterinarianSignature) {
                setValidationError("Please upload both owner and veterinarian signatures before completing.");
                return;
            }
        }

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
            dateOfRadiograph: dogData.dateOfRadiograph,
        };

        setIsComplete(true);
        onComplete(submissionType, dogCase, uploadedFiles!, ownerData, vetData);
    };

    // completed summary view
    if (isComplete && uploadedFiles) {
        const signatureCount = [uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length;
        return (
            <DogCompleteSummary
                dogIndex={dogIndex}
                submissionType={submissionType}
                dogData={dogData}
                ownerData={ownerData}
                vetData={vetData}
                uploadedFiles={uploadedFiles}
                signatureCount={signatureCount}
                onEdit={() => {
                    setIsComplete(false);
                }}
            />
        );
    }

    const uploadCount = (pdfFormFile ? 1 : 0) + selectedDicom.length + selectedDocs.length +
        (ownerSigFile ? 1 : 0) + (vetSigFile ? 1 : 0);

    const duplicateWarnings: string[] = [
        ...selectedDicom.filter((file) => uploadedNames.dicom.includes(file.name)).map((file) => `"${file.name}" in DICOM Files`),
        ...selectedDocs.filter((file) => uploadedNames.docs.includes(file.name)).map((file) => `"${file.name}" in Supporting Documents`),
        ...(pdfFormFile && uploadedNames.pdfForm.includes(pdfFormFile.name) ? [`"${pdfFormFile.name}" in PDF Submission Form`] : []),
        ...(ownerSigFile && uploadedNames.ownerSig.includes(ownerSigFile.name) ? [`"${ownerSigFile.name}" in Owner Signature`] : []),
        ...(vetSigFile && uploadedNames.vetSig.includes(vetSigFile.name) ? [`"${vetSigFile.name}" in Veterinarian Signature`] : []),
    ];

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

            {/* -- Mode + price card -- */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={submissionType === "pdf"}
                        onChange={(e) => {
                            setSubmissionType(e.target.checked ? "pdf" : "online");
                            setUploadedFiles(null);
                        }}
                        className="h-4 w-4 rounded border-gray-300 accent-[#506147]"
                    />
                    Submit via PDF form
                </label>
                {(() => {
                    const { base, levy, total } = calculatePrice(dogData.examType, dogData.isDogsAustraliaRegistered);
                    return (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">${base}</span>
                            <span className="mx-1.5 text-gray-400">+</span>
                            <span className="font-medium text-gray-900">${levy} ANKC Levy</span>
                            <span className="mx-1.5 text-gray-400">=</span>
                            <span className="font-semibold text-gray-900">${total}</span>
                        </p>
                    );
                })()}
            </div>

            {/* -- mode specific form sections -- */}
            {submissionType === "online" ? (
                <DogEntryOnlineForm
                    isDogsAustraliaRegistered={dogData.isDogsAustraliaRegistered}
                    dogData={dogData}
                    ownerData={ownerData}
                    vetData={vetData}
                    setDog={setDog}
                    setOwner={setOwner}
                    setVet={setVet}
                    selectedDicom={selectedDicom}
                    selectedDocs={selectedDocs}
                    ownerSigFile={ownerSigFile}
                    vetSigFile={vetSigFile}
                    onDicomChange={setSelectedDicom}
                    onDocsChange={setSelectedDocs}
                    onOwnerSigChange={setOwnerSigFile}
                    onVetSigChange={setVetSigFile}
                    resetKey={uploadKey}
                    uploadedFiles={uploadedFiles}
                />
            ) : (
                <DogEntryPdfForm
                    isDogsAustraliaRegistered={dogData.isDogsAustraliaRegistered}
                    setDog={setDog}
                    pdfFormFile={pdfFormFile}
                    selectedDicom={selectedDicom}
                    selectedDocs={selectedDocs}
                    onPdfFormChange={setPdfFormFile}
                    onDicomChange={setSelectedDicom}
                    onDocsChange={setSelectedDocs}
                    resetKey={uploadKey}
                    uploadedFiles={uploadedFiles}
                />
            )}

            {/* -- Upload + Mark Complete action card -- */}
            <div className="flex justify-between items-end rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="h-full flex flex-col align-bottom">
                    {duplicateWarnings.length > 0 && (
                        <p className="mt-2 text-sm text-amber-700">
                            Already uploaded: {duplicateWarnings.join(", ")}
                        </p>
                    )}
                    {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}

                    <div className="h-full flex flex-col flex-wrap items-start gap-4">
                        {uploadedFiles && (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">✓</span>
                                {uploadedFiles.dicomFiles.length + uploadedFiles.supportingDocuments.length +
                                [uploadedFiles.pdfForm, uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length} files uploaded
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

                <div className="flex flex-col items-center gap-3 border-t border-gray-100">
                    {validationError && <p className="text-sm text-end text-red-600">{validationError}</p>}
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
