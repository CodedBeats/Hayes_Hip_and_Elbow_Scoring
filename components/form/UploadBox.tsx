import { useState } from "react";

type Variant = "empty" | "pending" | "overLimit" | "uploaded" | "full";

const VARIANT_CLASSES: Record<Variant, string> = {
    empty: "border-gray-300 hover:border-brand-green-mid",
    pending: "border-brand-green-mid bg-cream",
    overLimit: "border-orange-400 bg-orange-50",
    uploaded: "border-green-300 bg-green-50",
    full: "border-gray-300 bg-gray-50",
};

const DRAGGING_CLASSES = "border-brand-green bg-cream";

// `accept` only filters the file picker - a drop skips it entirely, so dropped files
// are checked against the same extension list by hand
const matchesAccept = (fileName: string, accept: string) =>
    accept.split(",").some((ext) => fileName.toLowerCase().endsWith(ext.trim().toLowerCase()));

export const UploadBox = ({
    label,
    hint,
    icon,
    isRequired,
    description,
    file,
    files,
    isMultiple,
    onChange,
    onMultiChange,
    accept,
    resetKey,
    uploadedCount,
    isUploaded,
    duplicateFileNames,
    maxFiles,
}: {
    label: string;
    hint: string;
    icon: React.ReactNode;
    isRequired?: boolean;
    description?: string;
    file?: File | null;
    files?: File[];
    isMultiple?: boolean;
    onChange?: (f: File | null) => void;
    onMultiChange?: (f: File[]) => void;
    accept: string;
    resetKey: number;
    uploadedCount?: number;
    isUploaded?: boolean;
    duplicateFileNames?: string[];
    // multi-file boxes only - a single-file box just replaces its file, so it never fills up
    maxFiles?: number;
}) => {
    const [isDragging, setIsDragging] = useState(false);
    // tagged with the resetKey it happened under, so the message clears by itself once
    // the parent resets the box after an upload
    const [skippedDrop, setSkippedDrop] = useState<{ names: string[]; resetKey: number } | null>(null);

    const uploaded = uploadedCount ?? 0;
    const selected = files?.length ?? 0;
    const hasPending = isMultiple ? selected > 0 : !!file;
    const hasUploaded = isMultiple ? uploaded > 0 : !!isUploaded;

    const isAtLimit = maxFiles !== undefined && uploaded >= maxFiles;
    const isOverLimit = maxFiles !== undefined && uploaded + selected > maxFiles;

    // "pending" (just selected, not yet uploaded) takes visual priority over "uploaded"
    const getVariant = (): Variant => {
        if (hasPending) return isOverLimit ? "overLimit" : "pending";
        if (isAtLimit) return "full";
        if (hasUploaded) return "uploaded";
        return "empty";
    };
    const variant = getVariant();
    const isSelecting = variant === "pending" || variant === "overLimit";
    const skippedNames = skippedDrop?.resetKey === resetKey ? skippedDrop.names : [];

    // file picker and drop both end up here, so limits/duplicates/over-limit all behave the same
    const selectFiles = (picked: File[]) => {
        if (isMultiple) onMultiChange?.(picked);
        else onChange?.(picked[0] ?? null);
    };

    /**
     * Takes files dropped onto the box and selects them, the same as choosing them in
     * the file picker.
     *
     * @remarks
     * `preventDefault` is what stops the browser opening the dropped file in the tab,
     * which would also throw away anything selected but not uploaded yet. That's
     * why it runs even when the box is full and the drop is ignored. Wrong file types are
     * skipped and listed instead of failing the whole drop. If nothing usable was
     * dropped, the current selection is kept rather than cleared.
     */
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (isAtLimit) return;

        const dropped = Array.from(e.dataTransfer.files);
        const accepted = dropped.filter((f) => matchesAccept(f.name, accept));
        const skipped = dropped.filter((f) => !matchesAccept(f.name, accept)).map((f) => f.name);
        setSkippedDrop({ names: skipped, resetKey });

        if (accepted.length > 0) selectFiles(accepted);
    };

    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
                {isRequired && <span className="text-red-700">{" *"}</span>}
            </p>
            {description && (
                <p className="mb-2 text-xs text-gray-500">{description}</p>
            )}
            {duplicateFileNames && duplicateFileNames.length > 0 && (
                <p className="mb-2 text-xs text-amber-700">
                    Already uploaded previously: {duplicateFileNames.join(", ")}
                </p>
            )}
            <label className={`block ${isAtLimit ? "cursor-not-allowed" : "cursor-pointer"}`}>
                <div
                    // without preventDefault on dragover the browser refuses the drop
                    // and opens the file in the tab instead
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                        // only files, not dragged text or links
                        if (!isAtLimit && e.dataTransfer.types.includes("Files")) setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed p-5 text-center transition ${isDragging ? DRAGGING_CLASSES : VARIANT_CLASSES[variant]}`}
                >
                    {/* pointer-events-none stops dragleave firing every time the cursor
                        crosses a child (icon, text), which made the highlight flicker.
                        Clicks still reach the label, since they fall through to the box */}
                    <div className="pointer-events-none">
                        {icon}
                        {isDragging && (
                            <p className="mt-1 text-sm font-medium text-brand-green">
                                Drop to select {isMultiple ? "files" : "this file"}
                            </p>
                        )}
                        {!isDragging && variant === "empty" && (
                            <p className="mt-1 text-sm text-gray-500">{hint}</p>
                        )}
                        {!isDragging && variant === "uploaded" && (
                            <p className="mt-1 text-sm font-medium text-green-700">
                                {isMultiple
                                    ? `${uploaded}${maxFiles ? ` of ${maxFiles}` : ""} file${uploaded === 1 ? "" : "s"} uploaded - click or drag here to add more`
                                    : "Uploaded - click or drag here to replace"}
                            </p>
                        )}
                        {variant === "full" && (
                            <p className="mt-1 text-sm font-medium text-gray-600">
                                {uploaded} of {maxFiles} files uploaded - maximum reached. Delete a file below to add a different one.
                            </p>
                        )}
                        {isMultiple && files && files.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-left">
                                {files.map((f) => (
                                    <li
                                        key={f.name}
                                        className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                                        <span className="truncate">{f.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!isMultiple && file && (
                            <p className="mt-1 text-sm font-medium text-brand-green truncate px-2">
                                {file.name}
                            </p>
                        )}
                        {variant === "overLimit" && maxFiles !== undefined && (
                            <p className="mt-2 text-sm font-semibold text-orange-700">
                                Too many files: the limit is {maxFiles}
                                {uploaded > 0 && ` and ${uploaded} ${uploaded === 1 ? "is" : "are"} already uploaded`}.
                                {" "}Choose again with {maxFiles - uploaded} or fewer.
                            </p>
                        )}
                        {skippedNames.length > 0 && (
                            <p className="mt-2 text-xs font-medium text-orange-700">
                                Skipped (wrong file type): {skippedNames.join(", ")}
                            </p>
                        )}
                        {/* a filename showing in the box looked like a finished upload, so say plainly that it isn't */}
                        {isSelecting && (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                                Selected but not uploaded yet.{" "}
                                {isMultiple ? "Choosing again replaces this selection." : "Choosing again replaces this file."}
                            </p>
                        )}
                    </div>
                    <input
                        key={resetKey}
                        type="file"
                        accept={accept}
                        multiple={isMultiple}
                        disabled={isAtLimit}
                        className="hidden"
                        onChange={(e) => {
                            setSkippedDrop(null);
                            selectFiles(Array.from(e.target.files ?? []));
                        }}
                    />
                </div>
            </label>
            <p className="mt-1 text-xs text-gray-400">
                {accept.replace(/\./g, "").replace(/,/g, " / ").toUpperCase()}
                {maxFiles !== undefined && ` · up to ${maxFiles} files`}
            </p>
        </div>
    );
};
