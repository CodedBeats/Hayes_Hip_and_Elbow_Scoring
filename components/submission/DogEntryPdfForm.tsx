"use client";
// components
import { UploadBox } from "../form/UploadBox"
import { UploadedFileList } from "../form/UploadedFileList"
// icons
import { CloudIcon, DocumentIcon, PenIcon } from "../misc/Icons"
// types
import type { Files } from "@/types/submission";

type Props = {
    pdfFormFile: File | null;
    selectedDicom: File[];
    selectedDocs: File[];
    ownerSigFile: File | null;
    vetSigFile: File | null;
    onPdfFormChange: (file: File | null) => void;
    onDicomChange: (files: File[]) => void;
    onDocsChange: (files: File[]) => void;
    onOwnerSigChange: (file: File | null) => void;
    onVetSigChange: (file: File | null) => void;
    resetKey: number;
    uploadedFiles: Files | null;
};

export const DogEntryPdfForm = ({
    pdfFormFile,
    selectedDicom,
    selectedDocs,
    ownerSigFile,
    vetSigFile,
    onPdfFormChange,
    onDicomChange,
    onDocsChange,
    onOwnerSigChange,
    onVetSigChange,
    resetKey,
    uploadedFiles,
}: Props) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                    PDF
                </span>
                <h3 className="text-base font-semibold text-gray-900">
                    PDF Form Submission
                </h3>
            </div>

            <UploadBox
                label="Canine Hip & Elbow Dysplasia Scheme Submission Form"
                hint="Click to upload the completed PDF submission form"
                icon={<DocumentIcon />}
                isRequired
                file={pdfFormFile}
                onChange={onPdfFormChange}
                accept=".pdf"
                resetKey={resetKey}
            />
            <UploadedFileList
                files={ uploadedFiles?.pdfForm ? [uploadedFiles.pdfForm] : [] }
            />

            <UploadBox
                label="DICOM Files"
                hint="Select the .dcm files for Hips and/or Elbows, you can upload multiple files simultaneously"
                icon={<CloudIcon />}
                isRequired
                files={selectedDicom}
                isMultiple
                onMultiChange={onDicomChange}
                accept=".dcm"
                resetKey={resetKey}
            />
            <UploadedFileList files={uploadedFiles?.dicomFiles ?? []} />

            <UploadBox
                label="Supporting Documents"
                hint="Click to upload supporting PDF documents (optional)"
                icon={<DocumentIcon />}
                files={selectedDocs}
                isMultiple
                onMultiChange={onDocsChange}
                accept=".pdf"
                resetKey={resetKey}
            />
            <UploadedFileList files={uploadedFiles?.supportingDocuments ?? []} />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col">
                    <UploadBox
                        label="Owner Signature"
                        hint="Click to upload Owner signature (PNG/JPG)"
                        icon={<PenIcon />}
                        isRequired
                        file={ownerSigFile}
                        onChange={onOwnerSigChange}
                        accept=".png,.jpg,.jpeg"
                        resetKey={resetKey}
                    />
                    <UploadedFileList 
                        files={ uploadedFiles?.ownerSignature ? [uploadedFiles.ownerSignature] : [] } 
                    />
                </div>


                <div className="flex flex-col">
                    <UploadBox
                        label="Veterinarian Signature"
                        hint="Click to upload Veterinarian signature (PNG/JPG)"
                        icon={<PenIcon />}
                        isRequired
                        file={vetSigFile}
                        onChange={onVetSigChange}
                        accept=".png,.jpg,.jpeg"
                        resetKey={resetKey}
                    />
                    <UploadedFileList
                        files={ uploadedFiles?.veterinarianSignature ? [uploadedFiles.veterinarianSignature] : [] }
                    />
                </div>
            </div>
        </div>
    );
};
