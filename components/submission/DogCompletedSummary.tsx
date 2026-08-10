"use client";
// types
import type { DogEntryFormData } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { Files } from "@/types/submission";


type DogCompleteSummaryProps = {
    dogIndex: number;
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    uploadedFiles: Files;
    onEdit: () => void;
};

export const DogCompleteSummary = ({
    dogIndex,
    dogData,
    ownerData,
    uploadedFiles,
    onEdit,
}: DogCompleteSummaryProps) => {

    return (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">Dog {dogIndex}</span>
                    <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                        Complete
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onEdit()}
                    className="text-sm font-medium text-brand-green underline hover:text-[#3d4e36] transition"
                >
                    Edit
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                <span><span className="font-medium">Dog:</span> {dogData.registeredName}</span>
                <span><span className="font-medium">Breed:</span> {dogData.breed}</span>
                <span><span className="font-medium">Owner:</span> {ownerData.name}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {uploadedFiles.pdfForm && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">
                        1 PDF form
                    </span>
                )}
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">
                    {uploadedFiles.dicomFiles.length} DICOM
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">
                    {uploadedFiles.supportingDocuments.length} supporting docs
                </span>
            </div>
        </div>
    );
}
