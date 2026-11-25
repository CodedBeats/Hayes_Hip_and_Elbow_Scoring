type Props = {
    pendingCount: number;
    uploadedCount: number;
    // a box has more files selected than its limit allows - the box itself explains which
    isOverLimit: boolean;
    isUploading: boolean;
    uploadError: string | null;
    onUpload: () => void;
};

/**
 * Shown at the top of the Uploads card: explains how selecting and uploading
 * work, then gives a sticky bar with the upload status and the Upload Files button.
 *
 * @remarks
 * Submitters (and staff) kept thinking a file was uploaded as soon as its name
 * showed up in the box, and some never found the Upload Files button at the
 * bottom of the page. The steps make it clear that selecting and uploading are
 * separate. The bar is `sticky` so the button stays on screen while the user
 * works down through the upload boxes. It only sticks inside the Uploads card,
 * so it doesn't follow them around the rest of the form.
 */
export const UploadActionBar = ({ pendingCount, uploadedCount, isOverLimit, isUploading, uploadError, onUpload }: Props) => {
    const canUpload = pendingCount > 0 && !isOverLimit && !isUploading;

    return (
        <>
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                <li>
                    Click each box below, or drag files onto it, to choose your files. For DICOMs, you can
                    select several at once (hold <kbd className="font-semibold">Ctrl</kbd>, or{" "}
                    <kbd className="font-semibold">Cmd</kbd> on Mac, in the file browser).
                </li>
                <li>
                    Click <span className="font-semibold text-gray-900">Upload Files</span>. Choosing or dropping a
                    file only selects it. Nothing is saved until you upload.
                </li>
                <li>
                    Uploaded files are listed under each box. To add more, choose more files and upload again.
                </li>
            </ol>

            <div className="sticky top-4 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-warm-sand px-4 py-3 shadow-sm">
                <div className="text-sm">
                    <UploadStatus pendingCount={pendingCount} uploadedCount={uploadedCount} isOverLimit={isOverLimit} isUploading={isUploading} />
                    {uploadError && <p className="mt-1 text-red-600">{uploadError}</p>}
                </div>
                <button
                    type="button"
                    onClick={onUpload}
                    disabled={!canUpload}
                    className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d4e36] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isUploading ? "Uploading..." : `Upload Files (${pendingCount})`}
                </button>
            </div>
        </>
    );
};

const plural = (n: number) => `${n} file${n === 1 ? "" : "s"}`;

// selected-but-not-uploaded wins over "uploaded", since it's the state the user needs to act on
const UploadStatus = ({ pendingCount, uploadedCount, isOverLimit, isUploading }: Omit<Props, "uploadError" | "onUpload">) => {
    if (isUploading) return <p className="text-gray-600">Uploading {plural(pendingCount)}...</p>;

    // otherwise the button is just greyed out with no clue why
    if (isOverLimit) {
        return (
            <p className="font-medium text-orange-700">
                Too many files selected - see the box marked in orange below
            </p>
        );
    }

    if (pendingCount > 0) {
        return (
            <p className="font-medium text-amber-700">
                {plural(pendingCount)} selected but not uploaded yet
            </p>
        );
    }

    if (uploadedCount > 0) {
        return (
            <p className="inline-flex items-center gap-1.5 font-medium text-green-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">✓</span>
                {plural(uploadedCount)} uploaded
            </p>
        );
    }

    return <p className="text-gray-500">No files selected yet</p>;
};