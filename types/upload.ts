// active DICOM file
export type UploadedFile = {
    fileName: string;
    key: string;
}

export type UseUploadReturn = {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadedFile: UploadedFile | undefined;
    uploadSingleFile: (file: File) => Promise<UploadedFile>;
    resetUpload: () => void;
};