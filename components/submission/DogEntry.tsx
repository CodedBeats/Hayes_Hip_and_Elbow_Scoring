// dependencies
"use client";
import { useState } from "react";
// components
import { InputField } from "../form/InputField";
import { MobileField } from "../form/MobileField";
// types
import type { DogCase, DogFiles } from "@/types/dog";
import type { UploadedFile, UploadUrlResponse } from "@/types/upload";

type DogFormData = {
    // dog
    isDogsAustraliaRegistered: boolean;
    registeredName: string;
    registeredNumber: string;
    microchipNumber: string;
    breed: string;
    sex: "male" | "female";
    dateOfBirth: string;
    dateOfRadiograph: string;
    // owner
    ownerName: string;
    ownerEmail: string;
    ownerAddress: string;
    memberNumber: string;
    ownerTelephoneNumber: string;
    // vet
    referringVeterinarianName: string;
    referringVeterinarianPractice: string;
    veterinarianAddress: string;
    veterinarianPhone: string;
    positiveIdentificationSighted: boolean;
    certificateOfRegistrationAndPedigreeSighted: boolean;
};

const EMPTY_FORM: DogFormData = {
    isDogsAustraliaRegistered: false,
    registeredName: "",
    registeredNumber: "",
    microchipNumber: "",
    breed: "",
    sex: "male",
    dateOfBirth: "",
    dateOfRadiograph: "",
    ownerName: "",
    ownerEmail: "",
    ownerAddress: "",
    memberNumber: "",
    ownerTelephoneNumber: "",
    referringVeterinarianName: "",
    referringVeterinarianPractice: "",
    veterinarianAddress: "",
    veterinarianPhone: "",
    positiveIdentificationSighted: false,
    certificateOfRegistrationAndPedigreeSighted: false,
};

type Props = {
    submissionId: string;
    dogIndex: number;
    onComplete: (dog: DogCase) => void;
};

export const DogEntry = ({ submissionId, dogIndex, onComplete }: Props) => {
    const [dogId] = useState(() => crypto.randomUUID());
    const [formData, setFormData] = useState<DogFormData>(EMPTY_FORM);

    // file selection
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [selectedSigs, setSelectedSigs] = useState<File[]>([]);

    // upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<DogFiles | null>(null);

    // completion state
    const [isComplete, setIsComplete] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const set = (field: keyof DogFormData, value: string | boolean) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleUploadAll = async () => {
        const totalFiles = selectedDicom.length + selectedDocs.length + selectedSigs.length;
        if (totalFiles === 0) {
            setUploadError("Select at least one file before uploading.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
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
                ...selectedSigs.map((f) => ({
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
            const allFiles = [...selectedDicom, ...selectedDocs, ...selectedSigs];

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

            // map results back into DogFiles structure
            const dicomCount = selectedDicom.length;
            const docsCount = selectedDocs.length;
            const dogFiles: DogFiles = {
                dicomFiles: results.slice(0, dicomCount),
                supportingDocuments: results.slice(dicomCount, dicomCount + docsCount),
                ownerSignature: results[dicomCount + docsCount],
                veterinarianSignature: results[dicomCount + docsCount + 1],
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

        const required: (keyof DogFormData)[] = [
            "registeredName", "microchipNumber", "breed", "dateOfBirth", "dateOfRadiograph",
        ];
        const missing = required.find((f) => !formData[f]);
        if (missing) {
            setValidationError(`Please fill in all required fields (${missing} is empty).`);
            return;
        }
        if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) {
            setValidationError("Please upload at least one DICOM file before completing.");
            return;
        }

        const dogCase: DogCase = {
            id: dogId,
            isDogsAustraliaRegistered: formData.isDogsAustraliaRegistered,
            registeredName: formData.registeredName,
            registeredNumber: formData.registeredNumber || undefined,
            microchipNumber: formData.microchipNumber,
            breed: formData.breed,
            sex: formData.sex,
            dateOfBirth: formData.dateOfBirth,
            dateOfRadiograph: formData.dateOfRadiograph,
            files: uploadedFiles,
        };

        setIsComplete(true);
        onComplete(dogCase);
    };

    // completed summary view
    if (isComplete && uploadedFiles) {
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
                        onClick={() => setIsComplete(false)}
                        className="text-sm text-gray-500 underline hover:text-gray-700"
                    >
                        Edit
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                    <span><span className="font-medium">Name:</span> {formData.registeredName}</span>
                    <span><span className="font-medium">Breed:</span> {formData.breed}</span>
                    <span><span className="font-medium">Microchip:</span> {formData.microchipNumber}</span>
                    <span><span className="font-medium">Sex:</span> {formData.sex}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>{uploadedFiles.dicomFiles.length} DICOM</span>
                    <span>{uploadedFiles.supportingDocuments.length} docs</span>
                    <span>
                        {[uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length} signatures
                    </span>
                </div>
            </div>
        );
    }

    // full entry form
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Dog {dogIndex}</h3>

            {/* -- Dog Details -- */}
            <h4 className="mt-6 text-lg font-semibold text-gray-800">Dog Details</h4>
            <InputField
                name="isDogsAustraliaRegistered"
                label="Is Dog Registered with Dogs Australia?"
                type="checkbox"
                value={formData.isDogsAustraliaRegistered}
                onChange={(e) => set("isDogsAustraliaRegistered", e.target.checked)}
            />
            <InputField name="registeredName" label="Registered Name *" type="text"
                value={formData.registeredName} onChange={(e) => set("registeredName", e.target.value)} />
            <InputField name="registeredNumber" label="Registered Number" type="text"
                value={formData.registeredNumber} onChange={(e) => set("registeredNumber", e.target.value)} />
            <InputField name="microchipNumber" label="Microchip Number *" type="text"
                value={formData.microchipNumber} onChange={(e) => set("microchipNumber", e.target.value)} />
            <InputField name="breed" label="Breed *" type="text"
                value={formData.breed} onChange={(e) => set("breed", e.target.value)} />

            <div className="mb-4 w-full ">
                <label className="block mb-2 text-sm font-medium text-black">Sex *</label>
                <select
                    value={formData.sex}
                    onChange={(e) => set("sex", e.target.value as "male" | "female")}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <InputField name="dateOfBirth" label="Date of Birth *" type="date"
                value={formData.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            <InputField name="dateOfRadiograph" label="Date of Radiograph *" type="date"
                value={formData.dateOfRadiograph} onChange={(e) => set("dateOfRadiograph", e.target.value)} />

            {/* -- Owner Details -- */}
            <h4 className="mt-6 text-lg font-semibold text-gray-800">Owner Details</h4>
            <InputField name="ownerName" label="Owner Name" type="text"
                value={formData.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            <InputField name="ownerEmail" label="Owner Email" type="email"
                value={formData.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
            <InputField name="ownerAddress" label="Owner Address" type="text"
                value={formData.ownerAddress} onChange={(e) => set("ownerAddress", e.target.value)} />
            <InputField name="memberNumber" label="Member Number" type="text"
                value={formData.memberNumber} onChange={(e) => set("memberNumber", e.target.value)} />
            <MobileField
                value={formData.ownerTelephoneNumber}
                onChange={(value) => set("ownerTelephoneNumber", value)}
            />

            {/* -- Veterinarian Details -- */}
            <h4 className="mt-6 text-lg font-semibold text-gray-800">Veterinarian Details</h4>
            <InputField name="referringVeterinarianName" label="Referring Veterinarian Name" type="text"
                value={formData.referringVeterinarianName} onChange={(e) => set("referringVeterinarianName", e.target.value)} />
            <InputField name="referringVeterinarianPractice" label="Practice Name" type="text"
                value={formData.referringVeterinarianPractice} onChange={(e) => set("referringVeterinarianPractice", e.target.value)} />
            <InputField name="veterinarianAddress" label="Veterinarian Address" type="text"
                value={formData.veterinarianAddress} onChange={(e) => set("veterinarianAddress", e.target.value)} />
            <MobileField
                value={formData.veterinarianPhone}
                onChange={(value) => set("veterinarianPhone", value)}
            />
            <InputField name="positiveIdentificationSighted" label="Positive Identification Sighted" type="checkbox"
                value={formData.positiveIdentificationSighted} onChange={(e) => set("positiveIdentificationSighted", e.target.checked)} />
            <InputField name="certificateOfRegistrationAndPedigreeSighted" label="Certificate of Registration Sighted" type="checkbox"
                value={formData.certificateOfRegistrationAndPedigreeSighted} onChange={(e) => set("certificateOfRegistrationAndPedigreeSighted", e.target.checked)} />

            {/* -- File Upload -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Files</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">DICOM Files *</p>
                    <p className="text-xs text-gray-500">.dcm</p>
                    <input type="file" accept=".dcm" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setSelectedDicom(Array.from(e.target.files ?? []))} />
                    {selectedDicom.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDicom.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Supporting Docs</p>
                    <p className="text-xs text-gray-500">.pdf</p>
                    <input type="file" accept=".pdf" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setSelectedDocs(Array.from(e.target.files ?? []))} />
                    {selectedDocs.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDocs.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Signatures</p>
                    <p className="text-xs text-gray-500">.png / .jpg (owner first, vet second)</p>
                    <input type="file" accept=".png,.jpg,.jpeg" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => setSelectedSigs(Array.from(e.target.files ?? []))} />
                    {selectedSigs.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedSigs.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleUploadAll}
                    disabled={isUploading}
                    className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isUploading
                        ? "Uploading..."
                        : `Upload Files (${selectedDicom.length + selectedDocs.length + selectedSigs.length})`}
                </button>
                {uploadedFiles && (
                    <span className="text-sm text-green-600">
                        ✓ {uploadedFiles.dicomFiles.length + uploadedFiles.supportingDocuments.length +
                            [uploadedFiles.ownerSignature, uploadedFiles.veterinarianSignature].filter(Boolean).length} files uploaded
                    </span>
                )}
            </div>

            {uploadError && (
                <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}

            {/* -- Mark Complete -- */}
            <div className="mt-6 border-t border-gray-100 pt-5">
                {validationError && (
                    <p className="mb-3 text-sm text-red-600">{validationError}</p>
                )}
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
