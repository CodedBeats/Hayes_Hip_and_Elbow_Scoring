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
}) => {
    const hasFile = isMultiple ? (files?.length ?? 0) > 0 : !!file;
    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
                {isRequired && <span className="text-red-700">{" *"}</span>}
            </p>
            {description && (
                <p className="mb-2 text-xs text-gray-500">{description}</p>
            )}
            <label className="block cursor-pointer">
                <div
                    className={`rounded-xl border-2 border-dashed p-5 text-center transition ${hasFile ? "border-brand-green-mid bg-cream" : "border-gray-300 hover:border-brand-green-mid"}`}
                >
                    {icon}
                    {!hasFile && (
                        <p className="mt-1 text-sm text-gray-500">{hint}</p>
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
                    <input
                        key={resetKey}
                        type="file"
                        accept={accept}
                        multiple={isMultiple}
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
            </p>
        </div>
    );
};