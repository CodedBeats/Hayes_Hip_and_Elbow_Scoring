// dependencies
"use client";
import type { DogEntryFormData } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { Files } from "@/types/submission";


type DogCompleteSummaryProps = {
    dogIndex: number;
    submissionType: "online" | "pdf";
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    vetData: VeterinarianDetails;
    uploadedFiles: Files;
    signatureCount: number;
    onEdit: () => void;
};

export const DogCompleteSummary = ({
    dogIndex,
    submissionType,
    dogData,
    ownerData,
    vetData,
    uploadedFiles,
    signatureCount,
    onEdit,
}: DogCompleteSummaryProps) => {

    return (
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
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
                    className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                    Edit
                </button>
            </div>

            {submissionType === "pdf" ? (
                <div className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">PDF submission</span>
                </div>
            ) : (
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                    <span><span className="font-medium">Dog:</span> {dogData.registeredName}</span>
                    <span><span className="font-medium">Breed:</span> {dogData.breed}</span>
                    <span><span className="font-medium">Owner:</span> {ownerData.name}</span>
                    <span><span className="font-medium">Vet:</span> {vetData.veterinarianName}</span>
                </div>
            )}

            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                {uploadedFiles.pdfForm && <span>1 PDF form</span>}
                <span>{uploadedFiles.dicomFiles.length} DICOM</span>
                <span>{uploadedFiles.supportingDocuments.length} supporting docs</span>
                <span>{signatureCount} signature{signatureCount !== 1 ? "s" : ""}</span>
            </div>
        </div>
    );
}
