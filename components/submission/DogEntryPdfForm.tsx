"use client";
// components
import { UploadBox } from "../form/UploadBox"
// icons
import { CloudIcon, DocumentIcon, PenIcon } from "../misc/Icons"

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
};

export const DogEntryPdfForm = ({
    pdfFormFile, selectedDicom, selectedDocs, ownerSigFile, vetSigFile,
    onPdfFormChange, onDicomChange, onDocsChange, onOwnerSigChange, onVetSigChange,
    resetKey,
}: Props) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                    PDF
                </span>
                <h3 className="text-base font-semibold text-gray-900">PDF Form Submission</h3>
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

            <UploadBox
                label="DICOM Files"
                hint="Click to select .dcm files — multiple allowed"
                icon={<CloudIcon />}
                isRequired
                files={selectedDicom}
                isMultiple
                onMultiChange={onDicomChange}
                accept=".dcm"
                resetKey={resetKey}
            />

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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <UploadBox
                    label="Owner Signature"
                    hint="Click to upload scanned signature (PNG/JPG)"
                    icon={<PenIcon />}
                    isRequired
                    file={ownerSigFile}
                    onChange={onOwnerSigChange}
                    accept=".png,.jpg,.jpeg"
                    resetKey={resetKey}
                />
                <UploadBox
                    label="Veterinarian Signature"
                    hint="Click to upload Vet verification scan (PNG/JPG)"
                    icon={<PenIcon />}
                    isRequired                
                    file={vetSigFile}
                    onChange={onVetSigChange}
                    accept=".png,.jpg,.jpeg"
                    resetKey={resetKey}
                />
            </div>
        </div>
    );
};
