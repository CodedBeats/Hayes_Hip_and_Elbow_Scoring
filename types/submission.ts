import { type VeterinarianDetails } from './vet';
import { type OwnerDetails } from './owner';
import { type BillingInfo } from "./billing";
import { type DogCase } from "./dog";
import { UploadedFile } from './upload';


export type Submission = {
    id?: string;

    status: SubmissionStatus;

    submitterType: "owner" | "clinic";
    submitterId?: string; // future clinic account
    submissionType: "online" | "pdf";
    
    createdAt: Date;
    updatedAt?: Date;



    owner: OwnerDetails;

    veterinarian: VeterinarianDetails;

    dog: DogCase;



    files: Files;

    billing: BillingInfo;
};

export type Files = {
    dicomFiles: UploadedFile[];

    supportingDocuments: UploadedFile[];

    ownerSignature?: UploadedFile;

    veterinarianSignature?: UploadedFile;
};

export type SubmissionStatus =
    | "draft"
    | "submitted"
    | "pendingReview"
    | "reviewing"
    | "completed"
    | "archived";