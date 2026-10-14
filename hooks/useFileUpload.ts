// dependencies
import { useState } from "react";
// types
import { FileCategory, UploadedFile, UploadUrlResponse, UseUploadFileReturn } from "../types/upload";

export const useFileUpload = (): UseUploadFileReturn => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile>();

    const resetUpload = () => {
        setUploading(false);
        setProgress(0);
        setError(null);
        setUploadedFile(undefined);
    };

    /**
     * Uploads one file: requests a presigned S3 PUT URL, then PUTs directly to S3 with
     * progress tracking.
     *
     * @remarks
     * Two-step contract with `app/api/upload-url/route.ts`: this hook never talks to S3
     * credentials directly, it only ever receives a short-lived presigned URL to PUT to.
     * Progress percentage comes from the raw XHR upload event, not the URL-fetch step.
     */
    const uploadSingleFile = (
        file: File,
        opts: { submissionId: string; dogIndex: number; category: FileCategory },
    ): Promise<UploadedFile> => {
        return new Promise(async (resolve, reject) => {
            try {
                setUploading(true);
                setError(null);

                const urlRes = await fetch("/api/upload-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        submissionId: opts.submissionId,
                        files: [{
                            fileName: file.name,
                            contentType: file.type || "application/octet-stream",
                            dogIndex: opts.dogIndex,
                            category: opts.category,
                        }],
                    }),
                });

                if (!urlRes.ok) {
                    const body = await urlRes.json();
                    throw new Error(body.error ?? body.errors?.[0] ?? "Failed to get upload URL");
                }

                const { urls }: UploadUrlResponse = await urlRes.json();
                const { uploadUrl, key } = urls[0];

                const xhr = new XMLHttpRequest();
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const uploaded: UploadedFile = {
                            fileName: file.name,
                            key,
                            size: file.size,
                            contentType: file.type,
                            uploadedAt: new Date(),
                        };
                        setUploadedFile(uploaded);
                        setUploading(false);
                        resolve(uploaded);
                    } else {
                        setUploading(false);
                        reject(new Error("Upload to S3 failed"));
                    }
                };

                xhr.onerror = () => {
                    setUploading(false);
                    reject(new Error("Upload to S3 failed"));
                };

                xhr.send(file);
            } catch (err) {
                setUploading(false);
                setError(err instanceof Error ? err.message : "Upload failed");
                reject(err);
            }
        });
    };

    /**
     * Uploads multiple files for the same dog/category in one batch.
     *
     * @remarks
     * Same presigned-URL-then-PUT contract as {@link uploadSingleFile}, but requests all
     * URLs in a single `/api/upload-url` call and relies on the response `urls` array
     * being in the same order as the `files` array passed in - if that ordering ever
     * changed on the route side, uploads would land under the wrong keys.
     */
    const uploadBatch = (
        files: File[],
        opts: { submissionId: string; dogIndex: number; category: FileCategory },
    ): Promise<UploadedFile[]> => {
        return new Promise(async (resolve, reject) => {
            try {
                setUploading(true);
                setError(null);

                const urlRes = await fetch("/api/upload-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        submissionId: opts.submissionId,
                        files: files.map((f) => ({
                            fileName: f.name,
                            contentType: f.type || "application/octet-stream",
                            dogIndex: opts.dogIndex,
                            category: opts.category,
                        })),
                    }),
                });

                if (!urlRes.ok) {
                    const body = await urlRes.json();
                    throw new Error(body.error ?? body.errors?.[0] ?? "Failed to get upload URLs");
                }

                const { urls }: UploadUrlResponse = await urlRes.json();

                const results = await Promise.all(
                    files.map((file, i) =>
                        new Promise<UploadedFile>((res, rej) => {
                            const xhr = new XMLHttpRequest();
                            xhr.open("PUT", urls[i].uploadUrl);
                            xhr.setRequestHeader("Content-Type", file.type);
                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    res({
                                        fileName: file.name,
                                        key: urls[i].key,
                                        size: file.size,
                                        contentType: file.type,
                                        uploadedAt: new Date(),
                                    });
                                } else {
                                    rej(new Error(`Upload failed for ${file.name}`));
                                }
                            };
                            xhr.onerror = () => rej(new Error(`Upload failed for ${file.name}`));
                            xhr.send(file);
                        }),
                    ),
                );

                setUploading(false);
                resolve(results);
            } catch (err) {
                setUploading(false);
                setError(err instanceof Error ? err.message : "Upload failed");
                reject(err);
            }
        });
    };

    return {
        uploading,
        progress,
        error,
        uploadedFile,
        uploadSingleFile,
        uploadBatch,
        resetUpload,
    };
}
