"use client";
// components
import { UploadBox } from "../form/UploadBox"
import { UploadedFileList } from "../form/UploadedFileList"
// icons
import { CloudIcon, DocumentIcon } from "../misc/Icons"
// types
import type { DogEntryFormData } from "@/types/form";
import type { Files } from "@/types/submission";
import type { UploadedFile } from "@/types/upload";

type Props = {
    isDogsAustraliaRegistered: boolean;
    setDog: (field: keyof DogEntryFormData, value: string | boolean) => void;
    pdfFormFile: File | null;
    selectedDicom: File[];
    selectedDocs: File[];
    onPdfFormChange: (file: File | null) => void;
    onDicomChange: (files: File[]) => void;
    onDocsChange: (files: File[]) => void;
    resetKey: number;
    uploadedFiles: Files | null;
    duplicateDicomNames: string[];
    duplicateDocsNames: string[];
    duplicatePdfFormNames: string[];
    onDeleteFile: (category: keyof Files, file: UploadedFile) => void;
};

export const DogEntryPdfForm = ({
    isDogsAustraliaRegistered,
    setDog,
    pdfFormFile,
    selectedDicom,
    selectedDocs,
    onPdfFormChange,
    onDicomChange,
    onDocsChange,
    resetKey,
    uploadedFiles,
    duplicateDicomNames,
    duplicateDocsNames,
    duplicatePdfFormNames,
    onDeleteFile,
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

            {/* Registration toggle */}
            <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-gray-700">
                    Dogs Australia Registration
                </p>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="daReg-pdf"
                            checked={isDogsAustraliaRegistered}
                            onChange={() =>
                                setDog("isDogsAustraliaRegistered", true)
                            }
                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                        />
                        <span className="text-sm text-gray-700">
                            Registered
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="daReg-pdf"
                            checked={!isDogsAustraliaRegistered}
                            onChange={() =>
                                setDog("isDogsAustraliaRegistered", false)
                            }
                            className="h-4 w-4 border-gray-300 accent-[#506147]"
                        />
                        <span className="text-sm text-gray-700">
                            Not Registered
                        </span>
                    </label>
                </div>
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
                isUploaded={!!uploadedFiles?.pdfForm}
                duplicateFileNames={duplicatePdfFormNames}
            />
            <UploadedFileList
                files={ uploadedFiles?.pdfForm ? [uploadedFiles.pdfForm] : [] }
                onDelete={(file) => onDeleteFile("pdfForm", file)}
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
                uploadedCount={uploadedFiles?.dicomFiles.length ?? 0}
                duplicateFileNames={duplicateDicomNames}
            />
            <UploadedFileList
                files={uploadedFiles?.dicomFiles ?? []}
                onDelete={(file) => onDeleteFile("dicomFiles", file)}
            />

            <UploadBox
                label="Supporting Documents"
                hint="Click to upload supporting PDF documents (optional)"
                icon={<DocumentIcon />}
                description={
                    !isDogsAustraliaRegistered
                        ? "For dogs not registered with Dogs Australia, please upload a registration certificate or other document confirming dog's details, including date of birth, sex, and microchip number."
                        : undefined
                }
                files={selectedDocs}
                isMultiple
                onMultiChange={onDocsChange}
                accept=".pdf"
                resetKey={resetKey}
                uploadedCount={uploadedFiles?.supportingDocuments.length ?? 0}
                duplicateFileNames={duplicateDocsNames}
            />
            <UploadedFileList
                files={uploadedFiles?.supportingDocuments ?? []}
                onDelete={(file) => onDeleteFile("supportingDocuments", file)}
            />
        </div>
    );
};
