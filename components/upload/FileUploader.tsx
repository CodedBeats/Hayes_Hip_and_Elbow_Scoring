// dependencies
"use client";
import { useState } from "react";
// hooks
import { useUpload } from "@/hooks/useUpload";
// type
import { UploadedFile } from "@/types/upload";


export const FileUploader = () => {
    const {
        uploading,
        progress,
        error,
        uploadedFile,
        uploadSingleFile,
        resetUpload,
    } = useUpload();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadSingleFile(selectedFile);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        resetUpload();
    };

    return (
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">
                Upload DICOM File
            </h2>

            <p className="mt-2 text-sm text-gray-600">
                Select a <span className="font-medium">.dcm</span> file to upload.
            </p>

            <div className="mt-5">
                <input
                    type="file"
                    accept=".dcm"
                    onChange={handleFileChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-700"
                />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {uploading ? "Uploading..." : "Upload Files"}
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                    Reset
                </button>
            </div>
            
            {uploading && (
                <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
                        <span>Uploading file</span>
                        <span>{progress}%</span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full rounded-full bg-green-500 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {uploadedFile && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Uploaded File
                    </h3>

                    <div className="mt-4 space-y-3">
                        <div
                            key={uploadedFile.key}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                            <p className="font-medium text-gray-900">
                                {uploadedFile.fileName}
                            </p>
                            <p className="mt-1 break-all text-xs text-gray-500">
                                {uploadedFile.key}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


