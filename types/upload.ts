// active DICOM file
export type UploadedFile = {
    fileName: string;
    key: string;
}

export type UseUploadReturn = {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadedFiles: UploadedFile[];
    uploadFiles: (files: FileList | File[]) => Promise<UploadedFile[]>;
    resetUpload: () => void;
};