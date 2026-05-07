// dependencies
import { useState } from "react"
// logic
import { uploadSignatureImg } from "@/lib/firebase";
// types
import { UploadedImage, UseUploadImageReturn } from "../types/upload"

export function useImageUpload(): UseUploadImageReturn {
    // state
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage>();

    // reset upload handler
    const resetUpload = () => {
        setUploading(false);
        setProgress(0);
        setError(null);
        setUploadedImage(undefined);
    };


    // upload single img (signature)
    const uploadSingleImage = async (image: File, folderName: string): Promise<UploadedImage> => {
        try {
            setUploading(true);
            setError(null);

            // firebase upload func logic
            const uploadResult = await uploadSignatureImg(image.name, folderName, image);

            // update state with uploaded image info
            setUploadedImage({
                imageName: image.name,
                key: uploadResult.ref.fullPath,
            });

            return {
                imageName: image.name,
                key: uploadResult.ref.fullPath,
            };
        } catch (err) {
            setError("Failed to upload image.");
            throw err;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        progress,
        error,
        uploadedImage,
        uploadSingleImage,
        resetUpload,
    };
}