import type { UploadedFile } from "@/types/upload";
import { formatFileSize } from "@/lib/formatFileSize";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowDownTrayIcon, DocumentIcon } from "@/components/misc/Icons";

interface SupportingDocumentsCardProps {
    files: UploadedFile[];
}

export const SupportingDocumentsCard = ({ files }: SupportingDocumentsCardProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-brand-brown">Supporting Documents</h3>

            {files.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">No supporting documents uploaded.</p>
            ) : (
                <div className="mt-4 flex flex-col divide-y divide-gray-100">
                    {files.map((file) => (
                        <div key={file.key} className="flex items-center justify-between gap-3 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <DocumentIcon />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-brand-brown">{file.fileName}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <IconButton
                                icon={<ArrowDownTrayIcon />}
                                href={file.url}
                                download
                                disabled={!file.url}
                                ariaLabel={`Download ${file.fileName}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
