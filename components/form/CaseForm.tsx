// dependencies
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// === components ===
import { InputField } from "./InputField";
import { MobileField } from "./MobileField";
import { StripeCheckoutButton } from "../buttons/StripeCheckoutBtn";
import { TestLogBtn } from "../buttons/TestLogBtn";
// util
import { isNonEmptyString } from "@/util/stringManipulation";
// types
import { UploadedFile, UploadUrlResponse } from "@/types/upload";

export const CaseForm = () => {
    const router = useRouter();

    // --- form state ---
    const [formData, setFormData] = useState({
        // dog details
        isDogsAustraliaRegistered: true,
        registeredName: "Dog Man",
        registeredNumber: "333registeredNumber",
        microchipNumber: "333microchipNumber",
        breed: "333breed",
        // owner details
        ownerName: "444ownerName",
        ownerEmail: "444email@me.com",
        ownerAddress: "444ownerAddress",
        memberNumber: "444memberNumber",
        ownerTelephoneNumber: "0909 999 999",
        // veterinarian details
        referringVeterinarianName: "555referringVeterinarianName",
        referringVeterinarianPractice: "555referringVeterinarianPractice",
        veterinarianAddress: "555veterinarianAddress",
        veterinarianPhone: "0808 888 888",
        positiveIdentificationSighted: true,
        certificateOfRegistrationAndPedigreeSighted: true,
        dateOfRadiograph: "1st of The Month",
    });
    const [isLoading, setIsLoading] = useState(false);

    // --- upload state ---
    const [submissionId] = useState(() => crypto.randomUUID());
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [selectedSigs, setSelectedSigs] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedResults, setUploadedResults] = useState<UploadedFile[]>([]);

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            localStorage.setItem("caseFormData", JSON.stringify(formData));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadAll = async () => {
        const totalFiles = selectedDicom.length + selectedDocs.length + selectedSigs.length;
        if (totalFiles === 0) {
            setUploadError("Select at least one file before uploading.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadedResults([]);

        try {
            // Build request array — order must match allFiles below
            const fileRequests = [
                ...selectedDicom.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "application/dicom",
                    dogIndex: 1,
                    category: "dicom" as const,
                })),
                ...selectedDocs.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "application/pdf",
                    dogIndex: 1,
                    category: "supporting-documents" as const,
                })),
                ...selectedSigs.map((f) => ({
                    fileName: f.name,
                    contentType: f.type || "image/png",
                    dogIndex: 1,
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
                throw new Error(
                    body.errors?.join(", ") ?? body.error ?? "Failed to get upload URLs",
                );
            }

            const { urls }: UploadUrlResponse = await urlRes.json();

            // PUT all files in parallel — same order as fileRequests
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
                        xhr.onerror = () =>
                            reject(new Error(`Upload failed for ${file.name}`));
                        xhr.send(file);
                    }),
                ),
            );

            setUploadedResults(results);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const dogDetailsFields = [
        { name: "isDogsAustraliaRegistered", label: "Is Dog Registered with Dogs Australia?", type: "checkbox" },
        { name: "registeredName", label: "Registered Name", type: "text" },
        { name: "registeredNumber", label: "Registered Number", type: "text" },
        { name: "microchipNumber", label: "Microchip Number", type: "text" },
        { name: "breed", label: "Breed", type: "text" },
    ];
    const ownerDetailsFields = [
        { name: "ownerName", label: "Owner Name", type: "text" },
        { name: "ownerEmail", label: "Owner Email", type: "email" },
        { name: "ownerAddress", label: "Owner Address", type: "text" },
        { name: "memberNumber", label: "Member Number", type: "text" },
        { name: "ownerTelephoneNumber", label: "Owner Telephone Number", type: "text" },
    ];
    const veterinarianDetailsFields = [
        { name: "referringVeterinarianName", label: "Referring Veterinarian Name", type: "text" },
        { name: "referringVeterinarianPractice", label: "Referring Veterinarian Practice", type: "text" },
        { name: "veterinarianAddress", label: "Veterinarian Address", type: "text" },
        { name: "veterinarianPhone", label: "Veterinarian Phone", type: "text" },
        { name: "positiveIdentificationSighted", label: "Positive Identification Sighted", type: "checkbox" },
        { name: "certificateOfRegistrationAndPedigreeSighted", label: "Certificate of Registration and Pedigree Sighted", type: "checkbox" },
        { name: "dateOfRadiograph", label: "Date of Radiograph", type: "date" },
    ];

    return (
        <>
            {/* ======================== */}
            {/* MAIN FORM               */}
            {/* ======================== */}
            <form onSubmit={handleFormSubmit}>
                <h1 className="text-3xl mt-10">Dog Details</h1>
                {dogDetailsFields.map((field) => (
                    <InputField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                ))}

                <h2 className="text-3xl mt-10">Owner Details</h2>
                {ownerDetailsFields.map((field) =>
                    field.name === "ownerTelephoneNumber" ? (
                        <MobileField
                            key={field.name}
                            value={formData[field.name as keyof typeof formData] as string}
                            onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                        />
                    ) : (
                        <InputField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            type={field.type}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    ),
                )}

                <h2 className="text-3xl mt-10">Veterinarian Details</h2>
                {veterinarianDetailsFields.map((field) =>
                    field.name === "veterinarianPhone" ? (
                        <MobileField
                            key={field.name}
                            value={formData[field.name]}
                            onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                        />
                    ) : (
                        <InputField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            type={field.type}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        />
                    ),
                )}

                <div className="flex flex-col mt-10">
                    <StripeCheckoutButton
                        disabled={isLoading}
                        text="Proceed to Checkout"
                    />
                </div>
                <div>
                    <TestLogBtn data={formData} />
                </div>
            </form>

            {/* ======================== */}
            {/* UPLOAD SECTION          */}
            {/* ======================== */}
            <div className="mt-16 border-t-2 border-dashed border-gray-300 pt-10">
                <h2 className="text-3xl font-bold text-gray-900">Upload Files</h2>
                <p className="mt-1 font-mono text-xs text-gray-400">
                    submission: {submissionId}
                </p>

                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    {/* DICOM */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">DICOM Files</h3>
                        <p className="mt-1 text-xs text-gray-500">.dcm — select one or more</p>
                        <input
                            type="file"
                            accept=".dcm"
                            multiple
                            className="mt-4 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            onChange={(e) => setSelectedDicom(Array.from(e.target.files ?? []))}
                        />
                        {selectedDicom.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {selectedDicom.map((f) => (
                                    <li key={f.name} className="truncate text-xs text-gray-700">
                                        {f.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Supporting Documents */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                        <p className="mt-1 text-xs text-gray-500">.pdf — select one or more</p>
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            className="mt-4 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            onChange={(e) => setSelectedDocs(Array.from(e.target.files ?? []))}
                        />
                        {selectedDocs.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {selectedDocs.map((f) => (
                                    <li key={f.name} className="truncate text-xs text-gray-700">
                                        {f.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Signatures</h3>
                        <p className="mt-1 text-xs text-gray-500">.png / .jpg — select one or more</p>
                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            multiple
                            className="mt-4 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                            onChange={(e) => setSelectedSigs(Array.from(e.target.files ?? []))}
                        />
                        {selectedSigs.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {selectedSigs.map((f) => (
                                    <li key={f.name} className="truncate text-xs text-gray-700">
                                        {f.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Upload button */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleUploadAll}
                        disabled={isUploading}
                        className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isUploading ? "Uploading..." : `Upload All (${selectedDicom.length + selectedDocs.length + selectedSigs.length} files)`}
                    </button>
                </div>

                {/* Error */}
                {uploadError && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {uploadError}
                    </div>
                )}

                {/* Results */}
                {uploadedResults.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Uploaded ({uploadedResults.length} files)
                        </h3>
                        <ul className="mt-3 space-y-2">
                            {uploadedResults.map((f) => (
                                <li
                                    key={f.key}
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                >
                                    <p className="font-medium text-gray-900">{f.fileName}</p>
                                    <p className="mt-0.5 break-all font-mono text-xs text-gray-500">
                                        {f.key}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
};
