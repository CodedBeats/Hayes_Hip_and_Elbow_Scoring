// case type
export type Case = {
    // case details
    id?: string;
    status: CaseStatus;
    createdAt: Date;
    updatedAt?: Date;
    uploadedDICOMFileRef: string | null; // ref to .dcm file uploaded on s3

    // dog details
    isDogsAustraliaRegistered: boolean;
    registeredName: string;
    registeredNumber: string;
    microchipNumber: string;
    breed: string;

    // owner details
    ownerName: string;
    ownerEmail: string;
    ownerAddress: string;
    ownerTelephoneNumber: string;
    memberNumber: string;
    ownerSignatureRef: string; // ref to .png/.jpg file uploaded on s3

    // veterinarian details
    referringVeterinarianName: string;
    referringVeterinarianPractice: string;
    veterinarianAddress: string;
    veterinarianPhone: string;
    positiveIdentificationSighted: boolean;
    certificateOfRegistrationAndPedigreeSighted: boolean;
    dateOfRadiograph: string;
    veterinarianSignatureRef: string; // ref to .png/.jpg file uploaded on s3
};

export type CaseStatus = "pendingReview" | "reviewing" | "completed" | "archived";