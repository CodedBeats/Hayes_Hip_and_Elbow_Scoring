import { type UploadedFile } from "./upload";
import type { ExamType } from "./form";

export type DogCase = {
    id: string;

    examType: ExamType;

    isDogsAustraliaRegistered: boolean;

    registeredName: string;
    registeredNumber?: string;

    microchipNumber: string;

    breed: string;

    sex: "male" | "female";

    dateOfBirth: string;

    dateOfRadiograph: string;
};
