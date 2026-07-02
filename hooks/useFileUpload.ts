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
