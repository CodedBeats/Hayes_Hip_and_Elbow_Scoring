"use client";
// components
import { IconButton } from "../ui/IconButton";
import { TrashIcon } from "../misc/Icons";
// types
import type { UploadedFile } from "@/types/upload";

type Props = {
    files: UploadedFile[];
    onDelete?: (file: UploadedFile) => void;
};

export const UploadedFileList = ({ files, onDelete }: Props) => (
    files.length === 0 ? null : (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">
                    ✓
                </span>
                <p className="text-sm font-medium text-green-800">
                    Uploaded ({files.length})
                </p>
            </div>

            <ul className="space-y-1">
                {files.map((f) => (
                    <li
                        key={f.key}
                        className="flex items-center justify-between gap-2 text-sm text-gray-700"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                            <span className="truncate">{f.fileName}</span>
                        </span>
                        {onDelete && (
                            <IconButton
                                icon={<TrashIcon />}
                                ariaLabel={`Remove ${f.fileName}`}
                                className="shrink-0 hover:bg-red-100 hover:text-red-600"
                                onClick={() => {
                                    if (window.confirm(`Delete the uploaded file "${f.fileName}"? This cannot be undone.`)) {
                                        onDelete(f);
                                    }
                                }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
);