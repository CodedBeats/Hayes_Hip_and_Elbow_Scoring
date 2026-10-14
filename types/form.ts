export type ExamType = "hipsAndElbows" | "hipsOnly" | "elbowsOnly";

export type DogEntryFormData = {
    examType: ExamType;
    isDogsAustraliaRegistered: boolean;
    registeredName: string;
    registeredNumber: string;
    microchipNumber: string;
    breed: string;
    sex: "male" | "female";
    dateOfBirth: string;
};