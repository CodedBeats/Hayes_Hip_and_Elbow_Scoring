import type { UploadedFile } from "@/types/upload";
import { DicomPreviewCard } from "@/components/admin/DicomPreviewCard";
import { SignatureAssetCard } from "@/components/admin/SignatureAssetCard";
import { ScanIcon } from "@/components/misc/Icons";

interface AssetManagementCardProps {
    dicomFiles: UploadedFile[];
    ownerSignature?: UploadedFile;
    veterinarianSignature?: UploadedFile;
    pdfForm?: UploadedFile;
}

export const AssetManagementCard = ({
    dicomFiles,
    ownerSignature,
    veterinarianSignature,
    pdfForm,
}: AssetManagementCardProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    <ScanIcon className="h-5 w-5 text-blue-600" />
                </span>
                <h3 className="text-lg font-bold text-brand-brown">Asset Management</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-4">
                    {dicomFiles.length === 0 ? (
                        <p className="text-sm text-gray-400">No DICOM files uploaded.</p>
                    ) : (
                        dicomFiles.map((file) => <DicomPreviewCard key={file.key} file={file} />)
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <SignatureAssetCard label="Owner Signature" file={ownerSignature} />
                    <SignatureAssetCard label="Vet Signature" file={veterinarianSignature} />
                    {pdfForm && <SignatureAssetCard label="Submission PDF Form" file={pdfForm} />}
                </div>
            </div>
        </div>
    );
};
