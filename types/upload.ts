export type FileCategory = "dicom" | "supporting-documents" | "pdf-forms";

export type UploadUrlFileRequest = {
    fileName: string;
    contentType: string;
    dogIndex: number;
    category: FileCategory;
};

export type UploadUrlRequest = {
    submissionId?: string;
    files: UploadUrlFileRequest[];
};

export type UploadUrlEntry = {
    uploadUrl: string;
    key: string;
    fileName: string;
};

export type UploadUrlResponse = {
    submissionId: string;
    urls: UploadUrlEntry[];
};

export type UploadedFile = {
    fileName: string;
    key: string;
    url?: string;
    size: number;
    contentType: string;
    uploadedAt: Date;
};

export type UseUploadFileReturn = {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadedFile: UploadedFile | undefined;
    uploadSingleFile: (
        file: File,
        opts: { submissionId: string; dogIndex: number; category: FileCategory }
    ) => Promise<UploadedFile>;
    uploadBatch: (
        files: File[],
        opts: { submissionId: string; dogIndex: number; category: FileCategory }
    ) => Promise<UploadedFile[]>;
    resetUpload: () => void;
};
