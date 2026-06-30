import { type UploadedFile } from "./upload";

export type DogCase = {
    id: string;

    isDogsAustraliaRegistered: boolean;

    registeredName: string;
    registeredNumber?: string;

    microchipNumber: string;

    breed: string;

    sex: "male" | "female";

    dateOfBirth: string;

    dateOfRadiograph: string;

    files: DogFiles;
};

export type DogFiles = {
    dicomFiles: UploadedFile[];

    supportingDocuments: UploadedFile[];

    ownerSignature?: UploadedFile;

    veterinarianSignature?: UploadedFile;
};