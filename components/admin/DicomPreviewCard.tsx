import type { UploadedFile } from "@/types/upload";
import { formatFileSize } from "@/lib/formatFileSize";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowDownTrayIcon } from "@/components/misc/Icons";

interface DicomPreviewCardProps {
    file: UploadedFile;
}

export const DicomPreviewCard = ({ file }: DicomPreviewCardProps) => {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-brown">{file.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)} • DICOM</p>
                </div>
                <IconButton
                    icon={<ArrowDownTrayIcon />}
                    href={file.url}
                    download
                    disabled={!file.url}
                    ariaLabel={`Download ${file.fileName}`}
                />
            </div>
        </div>
    );
};
