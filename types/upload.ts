// active DICOM file
export type UploadedFile = {
    fileName: string;
    key: string;
}
export type UseUploadFileReturn = {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadedFile: UploadedFile | undefined;
    uploadSingleFile: (file: File) => Promise<UploadedFile>;
    resetUpload: () => void;
};


export type UploadedImage = {
    imageName: string;
    key: string;
}
export type UseUploadImageReturn = {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadedImage: UploadedImage | undefined;
    uploadSingleImage: (image: File, folderName: string) => Promise<UploadedImage>;
    resetUpload: () => void;
};
