// dependencies
"use client";
import { useState } from "react";
// lib
import { saveDraftFiles } from "@/lib/firebase";
// types
import type { Files } from "@/types/submission";
import type { UploadedFile, UploadUrlResponse } from "@/types/upload";

export type UploadedNames = {
    dicom: string[];
    docs: string[];
    pdfForm: string[];
    ownerSig: string[];
    vetSig: string[];
};

export const EMPTY_UPLOADED_NAMES: UploadedNames = {
    dicom: [], docs: [], pdfForm: [], ownerSig: [], vetSig: [],
};

// maps a Files category to its corresponding key in `uploadedNames`, so a deleted
// file's name can be un-flagged as a duplicate
const UPLOADED_NAMES_FIELD: Record<keyof Files, keyof UploadedNames> = {
    dicomFiles: "dicom",
    supportingDocuments: "docs",
    pdfForm: "pdfForm",
    ownerSignature: "ownerSig",
    veterinarianSignature: "vetSig",
};

type Args = {
    submissionId: string;
    dogIndex: number;
    submissionType: "online" | "pdf";
    initialUploadedFiles: Files | null;
    initialUploadedNames: UploadedNames;
};

/**
 * Owns file selection, upload, and deletion for a single dog entry - everything from
 * "which files has the user picked" through to "they're confirmed in S3 and recorded
 * in the Firestore draft".
 *
 * @remarks
 * Extracted out of `DogEntry.tsx` since this state/logic is entirely self-contained
 * (never reached into dog/owner/vet form state) - `DogEntry` still owns
 * `submissionType`/`dogIndex`/`submissionId` and passes them in, since a mode switch or
 * dog-count change happens above this hook.
 */
export const useDogFileUpload = ({
    submissionId,
    dogIndex,
    submissionType,
    initialUploadedFiles,
    initialUploadedNames,
}: Args) => {
    // file objects
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [ownerSigFile, setOwnerSigFile] = useState<File | null>(null);
    const [vetSigFile, setVetSigFile] = useState<File | null>(null);
    const [pdfFormFile, setPdfFormFile] = useState<File | null>(null);

    // upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Files | null>(initialUploadedFiles);
    const [uploadKey, setUploadKey] = useState(0);
    const [uploadedNames, setUploadedNames] = useState<UploadedNames>(initialUploadedNames);

    /**
     * Requests presigned S3 upload URLs for every selected file, PUTs them directly to
     * S3, then records the result as a Firestore draft.
     *
     * @remarks
     * Files are flattened into one `orderedFiles` array (in a fixed pdfForm / dicom /
     * docs / signatures order) before upload, because `app/api/upload-url/route.ts`
     * returns presigned URLs as a flat array in request order with no other way to
     * correlate a result back to its original category. After the uploads resolve, the
     * results array is sliced back into the `Files` shape using a running `cursor` and
     * the known per-category counts (`pdfOffset`, `dicomCount`, `docsCount`) - if the
     * order this array is built in ever changes, the slicing offsets below must change
     * to match, or files will silently land in the wrong `Files` field.
     *
     * A failed {@link saveDraftFiles} call is swallowed (logged only) since the S3
     * upload itself already succeeded by that point - the cleanup cron job existing is
     * a nice-to-have, not something worth failing the user's upload over.
     */
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
            const mergedFiles: Files = {
                pdfForm: dogFiles.pdfForm ?? uploadedFiles?.pdfForm,
                dicomFiles: [...(uploadedFiles?.dicomFiles ?? []), ...dogFiles.dicomFiles],
                supportingDocuments: [...(uploadedFiles?.supportingDocuments ?? []), ...dogFiles.supportingDocuments],
                ownerSignature: dogFiles.ownerSignature ?? uploadedFiles?.ownerSignature,
                veterinarianSignature: dogFiles.veterinarianSignature ?? uploadedFiles?.veterinarianSignature,
            };
            setUploadedFiles(mergedFiles);

            // Record these files in Firestore as a "draft" submission as soon as they're
            // confirmed in S3 - this is what lets the cleanup cron job
            // (app/api/cron/cleanup-drafts) find and delete orphaned uploads if the
            // customer never marks this dog complete / never checks out. A failure here
            // must never block the user's upload, which already succeeded - just log it.
            try {
                await saveDraftFiles(submissionId, dogIndex, submissionType, mergedFiles);
            } catch (draftErr) {
                console.error("Failed to save draft submission record:", draftErr);
            }

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

    /**
     * Removes one uploaded file: deletes the S3 object, clears the reference from
     * `uploadedFiles`, and updates the Firestore draft doc to match.
     *
     * @remarks
     * Confirmation already happened in `UploadedFileList` before this is called.
     * Mirrors {@link handleUploadAll}'s error handling: a failed {@link saveDraftFiles}
     * is logged only, since the S3 deletion itself already succeeded by that point.
     */
    const handleDeleteFile = async (category: keyof Files, file: UploadedFile) => {
        setUploadError(null);
        try {
            const res = await fetch("/api/delete-file", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, key: file.key }),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? "Failed to delete file");
            }

            setUploadedFiles((prev) => {
                if (!prev) return prev;
                const updated: Files = category === "dicomFiles" || category === "supportingDocuments"
                    ? { ...prev, [category]: prev[category].filter((f) => f.key !== file.key) }
                    : { ...prev, [category]: undefined };

                saveDraftFiles(submissionId, dogIndex, submissionType, updated).catch((draftErr) => {
                    console.error("Failed to update draft after file deletion:", draftErr);
                });

                return updated;
            });

            // allow re-selecting a file with the same name without hitting the
            // "duplicate" warning, since the previous upload no longer exists
            const nameField = UPLOADED_NAMES_FIELD[category];
            setUploadedNames((prev) => ({
                ...prev,
                [nameField]: prev[nameField].filter((n) => n !== file.fileName),
            }));
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Failed to delete file");
        }
    };

    return {
        selectedDicom,
        setSelectedDicom,
        selectedDocs,
        setSelectedDocs,
        ownerSigFile,
        setOwnerSigFile,
        vetSigFile,
        setVetSigFile,
        pdfFormFile,
        setPdfFormFile,
        isUploading,
        uploadError,
        uploadedFiles,
        uploadKey,
        uploadedNames,
        handleUploadAll,
        handleDeleteFile,
    };
};
