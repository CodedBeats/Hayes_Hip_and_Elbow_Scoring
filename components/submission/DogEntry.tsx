// dependencies
"use client";
import { useState } from "react";
// components
import { InputField } from "../form/InputField";
import { MobileField } from "../form/MobileField";
// types
import type { DogCase } from "@/types/dog";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { Files } from "@/types/submission";
import type { UploadedFile, UploadUrlResponse } from "@/types/upload";

type DogFormData = {
    isDogsAustraliaRegistered: boolean;
    registeredName: string;
    registeredNumber: string;
    microchipNumber: string;
    breed: string;
    sex: "male" | "female";
    dateOfBirth: string;
    dateOfRadiograph: string;
};

const EMPTY_DOG: DogFormData = {
    isDogsAustraliaRegistered: false,
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
    onComplete: (dog: DogCase, files: Files, owner: OwnerDetails, veterinarian: VeterinarianDetails) => void;
};

export const DogEntry = ({ submissionId, dogIndex, onComplete }: Props) => {
    const [dogId] = useState(() => crypto.randomUUID());
    const [dogData, setDogData] = useState<DogFormData>(EMPTY_DOG);
    const [ownerData, setOwnerData] = useState<OwnerDetails>(EMPTY_OWNER);
    const [vetData, setVetData] = useState<VeterinarianDetails>(EMPTY_VET);

    // file selection - dicom + docs are multi, signatures are single
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [ownerSigFile, setOwnerSigFile] = useState<File | null>(null);
    const [vetSigFile, setVetSigFile] = useState<File | null>(null);

    // upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Files | null>(null);

    // completion state
    const [isComplete, setIsComplete] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const setDog = (field: keyof DogFormData, value: string | boolean) =>
        setDogData((prev) => ({ ...prev, [field]: value }));

    const setOwner = (field: keyof OwnerDetails, value: string) =>
        setOwnerData((prev) => ({ ...prev, [field]: value }));

    const setVet = (field: keyof VeterinarianDetails, value: string | boolean) =>
        setVetData((prev) => ({ ...prev, [field]: value }));

    const handleUploadAll = async () => {
        const signatureFiles = [ownerSigFile, vetSigFile].filter(Boolean) as File[];
        const totalFiles = selectedDicom.length + selectedDocs.length + signatureFiles.length;
        if (totalFiles === 0) {
            setUploadError("Select at least one file before uploading.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // flow/order: dicom > supporting-docs > owner-signature > vet-signature
            const fileRequests = [
                ...selectedDicom.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "application/dicom",
                    dogIndex,
                    category: "dicom" as const,
                })),
                ...selectedDocs.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "application/pdf",
                    dogIndex,
                    category: "supporting-documents" as const,
                })),
                ...signatureFiles.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "image/png",
                    dogIndex,
                    category: "signatures" as const,
                })),
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
            const allFiles = [...selectedDicom, ...selectedDocs, ...signatureFiles];

            const results = await Promise.all(
                allFiles.map((file, i) =>
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

            const dicomCount = selectedDicom.length;
            const docsCount = selectedDocs.length;
            const dogFiles: Files = {
                dicomFiles: results.slice(0, dicomCount),
                supportingDocuments: results.slice(dicomCount, dicomCount + docsCount),
                ownerSignature: ownerSigFile ? results[dicomCount + docsCount] : undefined,
                veterinarianSignature: vetSigFile
                    ? results[dicomCount + docsCount + (ownerSigFile ? 1 : 0)]
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
        onComplete(dogCase, uploadedFiles, ownerData, vetData);
    };

    // completed summary view
    if (isComplete && uploadedFiles) {
        const signatureCount = [uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length;
        return (
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900">Dog {dogIndex}</span>
                        <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                            Complete
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setIsComplete(false); setUploadedFiles(null); }}
                        className="text-sm text-gray-500 underline hover:text-gray-700"
                    >
                        Edit
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                    <span><span className="font-medium">Dog:</span> {dogData.registeredName}</span>
                    <span><span className="font-medium">Breed:</span> {dogData.breed}</span>
                    <span><span className="font-medium">Owner:</span> {ownerData.name}</span>
                    <span><span className="font-medium">Vet:</span> {vetData.veterinarianName}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>{uploadedFiles.dicomFiles.length} DICOM</span>
                    <span>{uploadedFiles.supportingDocuments.length} supporting docs</span>
                    <span>{signatureCount} signature{signatureCount !== 1 ? "s" : ""}</span>
                </div>
            </div>
        );
    }

    // full entry form
    const uploadCount = selectedDicom.length + selectedDocs.length +
        (ownerSigFile ? 1 : 0) + (vetSigFile ? 1 : 0);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Dog {dogIndex}</h3>

            {/* -- Dog Details -- */}
            <h4 className="mt-6 text-lg font-semibold text-gray-800">Dog Details</h4>
            <InputField
                name="isDogsAustraliaRegistered"
                label="Is Dog Registered with Dogs Australia?"
                type="checkbox"
                value={dogData.isDogsAustraliaRegistered}
                onChange={(e) => setDog("isDogsAustraliaRegistered", e.target.checked)}
            />
            <InputField name="registeredName" label="Registered Name *" type="text"
                value={dogData.registeredName} onChange={(e) => setDog("registeredName", e.target.value)} />
            <InputField name="registeredNumber" label="Registered Number" type="text"
                value={dogData.registeredNumber} onChange={(e) => setDog("registeredNumber", e.target.value)} />
            <InputField name="microchipNumber" label="Microchip Number *" type="text"
                value={dogData.microchipNumber} onChange={(e) => setDog("microchipNumber", e.target.value)} />
            <InputField name="breed" label="Breed *" type="text"
                value={dogData.breed} onChange={(e) => setDog("breed", e.target.value)} />

            <div className="mb-4 w-full">
                <label className="block mb-2 text-sm font-medium">Sex *</label>
                <select
                    value={dogData.sex}
                    onChange={(e) => setDog("sex", e.target.value as "male" | "female")}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <InputField name="dateOfBirth" label="Date of Birth *" type="date"
                value={dogData.dateOfBirth} onChange={(e) => setDog("dateOfBirth", e.target.value)} />
            <InputField name="dateOfRadiograph" label="Date of Radiograph *" type="date"
                value={dogData.dateOfRadiograph} onChange={(e) => setDog("dateOfRadiograph", e.target.value)} />

            {/* -- Owner Details -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Owner Details</h4>
            <InputField name="ownerName" label="Name *" type="text"
                value={ownerData.name} onChange={(e) => setOwner("name", e.target.value)} />
            <InputField name="ownerEmail" label="Email *" type="email"
                value={ownerData.email} onChange={(e) => setOwner("email", e.target.value)} />
            <MobileField value={ownerData.phone} onChange={(v) => setOwner("phone", v)} />
            <InputField name="ownerAddress" label="Address" type="text"
                value={ownerData.address} onChange={(e) => setOwner("address", e.target.value)} />
            <InputField name="memberNumber" label="Member Number" type="text"
                value={ownerData.memberNumber} onChange={(e) => setOwner("memberNumber", e.target.value)} />

            {/* -- Veterinarian Details -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Veterinarian Details</h4>
            <InputField name="veterinarianName" label="Veterinarian Name *" type="text"
                value={vetData.veterinarianName} onChange={(e) => setVet("veterinarianName", e.target.value)} />
            <InputField name="practiceName" label="Practice Name *" type="text"
                value={vetData.practiceName} onChange={(e) => setVet("practiceName", e.target.value)} />
            <InputField name="vetAddress" label="Address" type="text"
                value={vetData.address} onChange={(e) => setVet("address", e.target.value)} />
            <MobileField value={vetData.phone} onChange={(v) => setVet("phone", v)} />
            <InputField name="positiveIdentificationSighted" label="Positive Identification Sighted" type="checkbox"
                value={vetData.positiveIdentificationSighted}
                onChange={(e) => setVet("positiveIdentificationSighted", e.target.checked)} />
            <InputField name="certificateOfRegistrationSighted" label="Certificate of Registration Sighted" type="checkbox"
                value={vetData.certificateOfRegistrationSighted}
                onChange={(e) => setVet("certificateOfRegistrationSighted", e.target.checked)} />

            {/* -- Files -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Files</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* DICOM — multi */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">DICOM Files *</p>
                    <p className="text-xs text-gray-500">.dcm — one or more</p>
                    <input type="file" accept=".dcm" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setSelectedDicom(Array.from(e.target.files ?? []))} />
                    {selectedDicom.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDicom.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                {/* Supporting Docs - multi */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Supporting Documents</p>
                    <p className="text-xs text-gray-500">.pdf — one or more</p>
                    <input type="file" accept=".pdf" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setSelectedDocs(Array.from(e.target.files ?? []))} />
                    {selectedDocs.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDocs.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                {/* Owner Signature - single */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Owner Signature</p>
                    <p className="text-xs text-gray-500">.png / .jpg — one file</p>
                    <input type="file" accept=".png,.jpg,.jpeg"
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setOwnerSigFile(e.target.files?.[0] ?? null)} />
                    {ownerSigFile && <p className="mt-2 truncate text-xs text-gray-600">{ownerSigFile.name}</p>}
                </div>

                {/* Vet Signature - single */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Veterinarian Signature</p>
                    <p className="text-xs text-gray-500">.png / .jpg — one file</p>
                    <input type="file" accept=".png,.jpg,.jpeg"
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setVetSigFile(e.target.files?.[0] ?? null)} />
                    {vetSigFile && <p className="mt-2 truncate text-xs text-gray-600">{vetSigFile.name}</p>}
                </div>
            </div>

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
                            [uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length} files uploaded
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
