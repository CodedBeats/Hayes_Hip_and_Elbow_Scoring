// types
import type { UploadedFile } from "@/types/upload";
// components
import { Button } from "@/components/ui/Button";
import { DicomPreviewCard } from "@/components/admin/DicomPreviewCard";
import { FileAssetsCard } from "@/components/admin/FileAssetsCard";
import { ScanIcon } from "@/components/misc/Icons";


interface AssetManagementCardProps {
    dicomFiles: UploadedFile[];
    pdfForm?: UploadedFile;
}

export const AssetManagementCard = ({
    dicomFiles,
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

            <div className="mt-5 flex flex-col gap-6">
                {pdfForm && (
                    <FileAssetsCard label="Official CHED submission form">
                        <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                            {pdfForm.url ? (
                                <p className="w-full truncate px-2 text-center text-gray-500">{pdfForm.fileName}</p>
                            ) : (
                                <span className="text-xs text-gray-400">No preview</span>
                            )}
                        </div>

                        <Button
                            href={pdfForm.url}
                            variant="outline"
                            size="sm"
                            disabled={!pdfForm.url}
                            target="_blank"
                            className="w-full !border-gray-300 !text-brand-brown hover:!bg-gray-50"
                        >
                            Preview PDF File
                        </Button>
                    </FileAssetsCard>
                )}

                <FileAssetsCard label="DICOM files">
                    {dicomFiles.length === 0 ? (
                        <p className="text-sm text-gray-400">No DICOM files uploaded.</p>
                    ) : (
                        dicomFiles.map((file) => <DicomPreviewCard key={file.key} file={file} />)
                    )}
                </FileAssetsCard>
            </div>
        </div>
    );
};
