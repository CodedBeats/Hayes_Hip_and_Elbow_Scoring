export type DogEntryFormData = {
    isDogsAustraliaRegistered: boolean;
    registeredName: string;
    registeredNumber: string;
    microchipNumber: string;
    breed: string;
    sex: "male" | "female";
    dateOfBirth: string;
    dateOfRadiograph: string;
};