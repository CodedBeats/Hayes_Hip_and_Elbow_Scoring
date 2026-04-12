// case type
export type Case = {
    // case details
    id: string;
    status: CaseStatus;
    createdAt: Date;
    updatedAt: Date;
    // .dcm file uploaded ref
    uploadedFileRef: string | null;

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
    memberNumber: string;

    // veterinarian details
    referringVeterinarianName: string;
    referringVeerinarianPractice: string;
    veterinarianAddress: string;
    veterinarianPhone: string;
    positiveOdentificationSighted: boolean;
    certificateOfRegistrationAndPedigreeSighted: boolean;
    dateOfRadiograph: Date;
    veterinarianSignature: string; // ref to file

    // DICOM file ref
    uploadedDICOMFileRef: string | null;
};

export type CaseStatus = "pendingReview" | "reviewing" | "completed" | "archived";