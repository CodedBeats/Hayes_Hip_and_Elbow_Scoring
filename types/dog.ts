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
};
