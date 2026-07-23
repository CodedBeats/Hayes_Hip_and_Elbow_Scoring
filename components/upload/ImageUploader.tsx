"use client";
// components
import { FileUploader } from "./FileUploader";
// types
import { UploadedFile } from "@/types/upload";


type Props = {
    submissionId: string;
    dogIndex: number;
    onUploaded: (file: UploadedFile) => void;
};

export const ImageUploader = ({ submissionId, dogIndex, onUploaded }: Props) => {
    return (
        <FileUploader
            submissionId={submissionId}
            dogIndex={dogIndex}
            category="signatures"
            onUploaded={onUploaded}
        />
    );
};
