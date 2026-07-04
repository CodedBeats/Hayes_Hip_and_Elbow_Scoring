import type { UploadedFile } from "@/types/upload";
import { Button } from "@/components/ui/Button";
import { PenIcon } from "@/components/misc/Icons";

interface SignatureAssetCardProps {
    label: string;
    file?: UploadedFile;
}

export const SignatureAssetCard = ({ label, file }: SignatureAssetCardProps) => {
    return (
        <div className="rounded-xl border border-gray-200 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <PenIcon />
                {label}
            </p>

            <div className="mt-3 flex h-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                {file?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={label} className="h-full w-full object-contain" />
                ) : (
                    <span className="text-xs text-gray-400">No preview</span>
                )}
            </div>

            <Button
                href={file?.url}
                variant="outline"
                size="sm"
                disabled={!file?.url}
                className="mt-3 w-full !border-gray-300 !text-brand-brown hover:!bg-gray-50"
            >
                Preview PDF
            </Button>
        </div>
    );
};
