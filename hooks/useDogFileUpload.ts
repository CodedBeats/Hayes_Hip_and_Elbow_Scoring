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
};

export const EMPTY_UPLOADED_NAMES: UploadedNames = {
    dicom: [], docs: [], pdfForm: [],
};

// maps a Files category to its corresponding key in `uploadedNames`, so a deleted
// file's name can be un-flagged as a duplicate
const UPLOADED_NAMES_FIELD: Record<keyof Files, keyof UploadedNames> = {
    dicomFiles: "dicom",
    supportingDocuments: "docs",
    pdfForm: "pdfForm",
};

type Args = {
    submissionId: string;
    dogIndex: number;
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
 * (never reached into dog/owner form state) - `DogEntry` still owns `dogIndex`/
 * `submissionId`, since a dog-count change happens above this hook.
 */
export const useDogFileUpload = ({
    submissionId,
    dogIndex,
    initialUploadedFiles,
    initialUploadedNames,
}: Args) => {
    // file objects
    const [selectedDicom, setSelectedDicom] = useState<File[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
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
     * Files are flattened into one `orderedFiles` array (pdfForm / dicom / docs order)
     * before upload, because `app/api/upload-url/route.ts` returns presigned URLs as a
     * flat array in request order with no other way to correlate a result back to its
     * original category. After the uploads resolve, the results array is sliced back
     * into the `Files` shape using a running `cursor` and the known per-category counts
     * (`pdfOffset`, `dicomCount`, `docsCount`) - if the order this array is built in
     * ever changes, the slicing offsets below must change to match, or files will
     * silently land in the wrong `Files` field.
     *
     * A failed {@link saveDraftFiles} call doesn't undo the upload - the files are already
     * in S3 and kept in local state, and the next successful sync writes the full merged
     * list anyway. But it is surfaced via `uploadError` rather than only logged: silently
     * swallowing this is how Firestore and S3 drifted apart unnoticed when a customer came
     * back from an abandoned Stripe checkout (rules rejected every sync, the UI showed
     * success).
     */
    const handleUploadAll = async () => {
        const orderedFiles: File[] = [
            ...(pdfFormFile ? [pdfFormFile] : []),
            ...selectedDicom,
            ...selectedDocs,
        ];

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
            const fileRequests = [
                ...(pdfFormFile ? [{ fileName: pdfFormFile.name, contentType: pdfFormFile.type || "application/pdf", dogIndex, category: "pdf-forms" as const }] : []),
                ...selectedDicom.map((f) => ({ fileName: f.name, contentType: f.type || "application/dicom", dogIndex, category: "dicom" as const })),
                ...selectedDocs.map((f) => ({ fileName: f.name, contentType: f.type || "application/pdf", dogIndex, category: "supporting-documents" as const })),
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
            const pdfOffset = pdfFormFile ? 1 : 0;
            const pdfFormResult = pdfOffset ? results[0] : undefined;
            cursor += pdfOffset;

            const dicomCount = selectedDicom.length;
            const docsCount = selectedDocs.length;

            const dogFiles: Files = {
                pdfForm: pdfFormResult,
                dicomFiles: results.slice(cursor, cursor + dicomCount),
                supportingDocuments: results.slice(cursor + dicomCount, cursor + dicomCount + docsCount),
            };
            const mergedFiles: Files = {
                pdfForm: dogFiles.pdfForm ?? uploadedFiles?.pdfForm,
                dicomFiles: [...(uploadedFiles?.dicomFiles ?? []), ...dogFiles.dicomFiles],
                supportingDocuments: [...(uploadedFiles?.supportingDocuments ?? []), ...dogFiles.supportingDocuments],
            };
            setUploadedFiles(mergedFiles);

            // Record these files in Firestore as a "draft" submission as soon as they're
            // confirmed in S3 - this is what lets the cleanup cron job
            // (app/api/cron/cleanup-drafts) find and delete orphaned uploads if the
            // customer never marks this dog complete / never checks out. A failure here
            // must never block the user's upload, which already succeeded - but it must
            // be visible, not just logged.
            try {
                await saveDraftFiles(submissionId, dogIndex, mergedFiles);
            } catch (draftErr) {
                console.error("Failed to save draft submission record:", draftErr);
                setUploadError("Your files uploaded, but we couldn't link them to your submission. Please contact us if this keeps happening.");
            }

            setUploadedNames((prev) => ({
                dicom:   [...prev.dicom,   ...selectedDicom.map((f) => f.name)],
                docs:    [...prev.docs,    ...selectedDocs.map((f) => f.name)],
                pdfForm: [...prev.pdfForm, ...(pdfFormFile ? [pdfFormFile.name] : [])],
            }));
            setSelectedDicom([]);
            setSelectedDocs([]);
            setPdfFormFile(null);
            setUploadKey((k) => k + 1);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Removes one uploaded file: drops the reference from the Firestore draft doc and
     * `uploadedFiles`, then deletes the S3 object.
     *
     * @remarks
     * Confirmation already happened in `UploadedFileList` before this is called.
     *
     * Firestore is updated *before* S3, and a failure there aborts the whole delete. The
     * Firestore write is the step that can be rejected (security rules), the S3 delete
     * is the one that can't be undone - so checking first means a rejected write leaves
     * everything intact, instead of a doc pointing at a file that no longer exists. If
     * the S3 delete then fails, the worst case is an unreferenced object under this
     * submission's prefix - wasted storage, versus a case admin can't download.
     */
    const handleDeleteFile = async (category: keyof Files, file: UploadedFile) => {
        if (!uploadedFiles) return;
        setUploadError(null);

        const updated: Files = category === "dicomFiles" || category === "supportingDocuments"
            ? { ...uploadedFiles, [category]: uploadedFiles[category].filter((f) => f.key !== file.key) }
            : { ...uploadedFiles, [category]: undefined };

        try {
            await saveDraftFiles(submissionId, dogIndex, updated);
        } catch (draftErr) {
            console.error("Failed to update draft before file deletion:", draftErr);
            setUploadError("Couldn't remove this file from your submission. Please try again.");
            return;
        }

        // the reference is gone from Firestore now, so local state follows it regardless
        // of how the S3 delete below goes - otherwise the next sync would write the stale
        // reference straight back
        setUploadedFiles(updated);

        // allow re-selecting a file with the same name without hitting the
        // "duplicate" warning, since the previous upload no longer exists
        const nameField = UPLOADED_NAMES_FIELD[category];
        setUploadedNames((prev) => ({
            ...prev,
            [nameField]: prev[nameField].filter((n) => n !== file.fileName),
        }));

        // nothing references this object anymore, so a failure here is only wasted
        // storage - logged, not surfaced, since there's nothing the customer can do
        try {
            const res = await fetch("/api/delete-file", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, key: file.key }),
            });
            if (!res.ok) {
                const body = await res.json();
                console.error("S3 delete failed after draft update:", body.error);
            }
        } catch (err) {
            console.error("S3 delete failed after draft update:", err);
        }
    };

    return {
        selectedDicom,
        setSelectedDicom,
        selectedDocs,
        setSelectedDocs,
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
