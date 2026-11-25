type Variant = "empty" | "pending" | "overLimit" | "uploaded" | "full";

const VARIANT_CLASSES: Record<Variant, string> = {
    empty: "border-gray-300 hover:border-brand-green-mid",
    pending: "border-brand-green-mid bg-cream",
    overLimit: "border-orange-400 bg-orange-50",
    uploaded: "border-green-300 bg-green-50",
    full: "border-gray-300 bg-gray-50",
};

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
                <div className={`rounded-xl border-2 border-dashed p-5 text-center transition ${VARIANT_CLASSES[variant]}`}>
                    {icon}
                    {variant === "empty" && (
                        <p className="mt-1 text-sm text-gray-500">{hint}</p>
                    )}
                    {variant === "uploaded" && (
                        <p className="mt-1 text-sm font-medium text-green-700">
                            {isMultiple
                                ? `${uploaded}${maxFiles ? ` of ${maxFiles}` : ""} file${uploaded === 1 ? "" : "s"} uploaded - click to add more`
                                : "Uploaded - click to replace"}
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
                                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-green" />
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
                    {/* a filename showing in the box looked like a finished upload, so say plainly that it isn't */}
                    {isSelecting && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                            Selected but not uploaded yet.{" "}
                            {isMultiple ? "Choosing again replaces this selection." : "Choosing again replaces this file."}
                        </p>
                    )}
                    <input
                        key={resetKey}
                        type="file"
                        accept={accept}
                        multiple={isMultiple}
                        disabled={isAtLimit}
                        className="hidden"
                        onChange={(e) => {
                            if (isMultiple && onMultiChange)
                                onMultiChange(Array.from(e.target.files ?? []));
                            else if (onChange)
                                onChange(e.target.files?.[0] ?? null);
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
