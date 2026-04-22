// dependencies
import { useState } from "react"
// types
import { UploadedFile, UseUploadReturn } from "../types/upload"

export function useUpload(): UseUploadReturn {
    // state
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // reset upload handler
    const resetUpload = () => {
        setUploading(false);
        setProgress(0);
        setError(null);
        setUploadedFiles([]);
    };


    // upload single file (this one is new for me lol, pls work)
    const uploadSingleFile = (file: File): Promise<UploadedFile> => {
        return new Promise(async (resolve, reject) => {
            try {
                //ask backend for signed upload URL
                const urlRes = await fetch("/api/upload-url", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type || "application/octet-stream",
                    }),
                });

                if (!urlRes.ok) {
                    throw new Error("Failed to get upload URL");
                }

                const { uploadUrl, key } = await urlRes.json();

                // upload directly to S3 using XMLHttpRequest for progress tracking
                const xhr = new XMLHttpRequest();

                // set upload url
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);

                // track progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round(
                            (event.loaded / event.total) * 100,
                        );
                        setProgress(percent);
                    }
                };
                //  upload file
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({
                            fileName: file.name,
                            key,
                        });
                    } else {
                        reject(new Error("Upload failed"));
                    }
                };

                // handle errors
                xhr.onerror = () => reject(new Error("Upload failed"));
                // send file
                xhr.send(file);
            } catch (err) {
                reject(err);
            }
        });
    };


    // upload multiple (but idk yet)
    const uploadFiles = async (files: FileList | File[]): Promise<UploadedFile[]> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const fileArray = Array.from(files);
            const results: UploadedFile[] = [];

            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];

                const uploaded = await uploadSingleFile(file);
                results.push(uploaded);

                // overall progress for multiple files
                const overall = Math.round(((i + 1) / fileArray.length) * 100);
                setProgress(overall);
            }

            setUploadedFiles(results);
            return results;
        } catch (err) {
            setError("one or more files failed to upload");
            throw err;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        progress,
        error,
        uploadedFiles,
        uploadFiles,
        resetUpload,
    };
}