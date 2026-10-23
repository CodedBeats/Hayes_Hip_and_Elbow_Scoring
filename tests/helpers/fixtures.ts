import type { DogCase } from "@/types/dog";
import type { OwnerDetails } from "@/types/owner";
import type { Files } from "@/types/submission";
import type { UploadedFile } from "@/types/upload";
import type { DogEntryFormData } from "@/types/form";

// Small typed builders so each test only spells out the fields it actually cares about.

export const makeUploadedFile = (key: string, overrides: Partial<UploadedFile> = {}): UploadedFile => ({
    key,
    fileName: key.split("/").pop() ?? key,
    size: 123,
    contentType: "application/octet-stream",
    uploadedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
});

export const makeFiles = (overrides: Partial<Files> = {}): Files => ({
    dicomFiles: [makeUploadedFile("submissions/s1/dog1/dicom/a.dcm")],
    supportingDocuments: [makeUploadedFile("submissions/s1/dog1/supporting-documents/b.pdf")],
    pdfForm: makeUploadedFile("submissions/s1/dog1/pdf-forms/c.pdf"),
    ...overrides,
});

export const makeOwner = (overrides: Partial<OwnerDetails> = {}): OwnerDetails => ({
    name: "Jane Owner",
    email: "jane@example.com",
    phone: "+61 400000000",
    address: "1 Test St",
    memberNumber: "M-1",
    ...overrides,
});

export const makeDog = (overrides: Partial<DogCase> = {}): DogCase => ({
    id: "dog-1",
    examType: "hipsAndElbows",
    isDogsAustraliaRegistered: true,
    registeredName: "Rex",
    registeredNumber: "R-1",
    microchipNumber: "123456789012345",
    breed: "Labrador",
    sex: "male",
    dateOfBirth: "2022-01-01",
    ...overrides,
});

export const makeDogFormData = (overrides: Partial<DogEntryFormData> = {}): DogEntryFormData => ({
    examType: "hipsAndElbows",
    isDogsAustraliaRegistered: true,
    registeredName: "Rex",
    registeredNumber: "R-1",
    microchipNumber: "123456789012345",
    breed: "Labrador",
    sex: "male",
    dateOfBirth: "2022-01-01",
    ...overrides,
});