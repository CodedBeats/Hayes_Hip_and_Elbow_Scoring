// dependencies
"use client";
import { useState } from "react";
// components
import { DogCompleteSummary } from "./DogCompletedSummary";
import { DogEntryOnlineForm } from "./DogEntryOnlineForm";
import { DogEntryPdfForm } from "./DogEntryPdfForm";
// types
import type { DogEntryFormData } from "@/types/form";
import type { DogCase } from "@/types/dog";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { Files } from "@/types/submission";
import type { UploadedFile, UploadUrlResponse } from "@/types/upload";



const EMPTY_DOG: DogEntryFormData = {
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

type Props = {
    submissionId: string;
    dogIndex: number;
    onComplete: (
        submissionType: string,
        dog: DogCase,
        files: Files,
        owner: OwnerDetails,
        veterinarian: VeterinarianDetails,
    ) => void;
};

export const DogEntry = ({ submissionId, dogIndex, onComplete }: Props) => {
    const [dogId] = useState(() => crypto.randomUUID());
    const [dogData, setDogData] = useState<DogEntryFormData>(EMPTY_DOG);
    const [ownerData, setOwnerData] = useState<OwnerDetails>(EMPTY_OWNER);
    const [vetData, setVetData] = useState<VeterinarianDetails>(EMPTY_VET);

    // file selection
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [ownerSigFile, setOwnerSigFile] = useState<File | null>(null);
    const [vetSigFile, setVetSigFile] = useState<File | null>(null);
    const [pdfFormFile, setPdfFormFile] = useState<File | null>(null);

    // upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Files | null>(null);

    // mode toggles
    const [submissionType, setSubmissionType] = useState<"online" | "pdf">("online");

    // completion state
    const [isComplete, setIsComplete] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

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
            setUploadedFiles(dogFiles);
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
        } else {
            if (!dogData.registeredName || !dogData.microchipNumber || !dogData.breed ||
                !dogData.dateOfBirth || !dogData.dateOfRadiograph) {
                setValidationError("Please fill in all required dog fields.");
                return;
            }
            if (!ownerData.name || !ownerData.email || !ownerData.phone) {
                setValidationError("Please fill in the owner's name, email, and phone.");
                return;
            }
            if (!vetData.veterinarianName || !vetData.practiceName) {
                setValidationError("Please fill in the veterinarian name and practice name.");
                return;
            }
            if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) {
                setValidationError("Please upload at least one DICOM file before completing.");
                return;
            }
            if (!uploadedFiles.ownerSignature || !uploadedFiles.veterinarianSignature) {
                setValidationError("Please upload both owner and veterinarian signatures before completing.");
                return;
            }
        }

        const dogCase: DogCase = {
            id: dogId,
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
                    setUploadedFiles(null);
                }}
            />
        );
    }

    const uploadCount = (pdfFormFile ? 1 : 0) + selectedDicom.length + selectedDocs.length +
        (ownerSigFile ? 1 : 0) + (vetSigFile ? 1 : 0);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Dog {dogIndex}</h3>

            {/* -- Mode Toggles -- */}
            <div className="mt-4 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={dogData.isDogsAustraliaRegistered}
                        onChange={(e) => setDog("isDogsAustraliaRegistered", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    Dogs Australia Registered
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={submissionType === "pdf"}
                        onChange={(e) => {
                            setSubmissionType(e.target.checked ? "pdf" : "online");
                            setUploadedFiles(null);
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    Submit via PDF
                </label>
            </div>

            {/* -- mode specific form -- */}
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
                />
            ) : (
                <DogEntryPdfForm
                    pdfFormFile={pdfFormFile}
                    selectedDicom={selectedDicom}
                    selectedDocs={selectedDocs}
                    ownerSigFile={ownerSigFile}
                    vetSigFile={vetSigFile}
                    onPdfFormChange={setPdfFormFile}
                    onDicomChange={setSelectedDicom}
                    onDocsChange={setSelectedDocs}
                    onOwnerSigChange={setOwnerSigFile}
                    onVetSigChange={setVetSigFile}
                />
            )}

            {/* -- Upload -- */}
            <div className="mt-4 flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleUploadAll}
                    disabled={isUploading || uploadCount === 0}
                    className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isUploading ? "Uploading..." : `Upload Files (${uploadCount})`}
                </button>
                {uploadedFiles && (
                    <span className="text-sm text-green-600">
                        ✓ {uploadedFiles.dicomFiles.length + uploadedFiles.supportingDocuments.length +
                        [uploadedFiles.pdfForm, uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length} files uploaded
                    </span>
                )}
            </div>

            {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}

            {/* -- Mark Complete -- */}
            <div className="mt-6 border-t border-gray-100 pt-5">
                {validationError && <p className="mb-3 text-sm text-red-600">{validationError}</p>}
                <button
                    type="button"
                    onClick={handleMarkComplete}
                    className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500"
                >
                    Mark Dog {dogIndex} Complete
                </button>
            </div>
        </div>
    );
};
