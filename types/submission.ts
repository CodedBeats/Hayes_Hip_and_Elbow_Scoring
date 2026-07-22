import { type VeterinarianDetails } from './vet';
import { type OwnerDetails } from './owner';
import { type BillingInfo } from "./billing";
import { type DogCase } from "./dog";
import { UploadedFile } from './upload';


export type Submission = {
    id?: string;

    status: SubmissionStatus;

    submitterType: "anon" | "clinic";
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

/**
 * Uploaded S3 files for one dog.
 *
 * @remarks
 * `pdfForm` is only ever present for `submissionType: "pdf"` submissions;
 * `ownerSignature`/`veterinarianSignature` are collected differently per mode (separate
 * signature uploads in online mode, embedded in the PDF form itself in pdf mode - see
 * `DogEntry.tsx`'s `handleMarkComplete`).
 */
export type Files = {
    dicomFiles: UploadedFile[];
    supportingDocuments: UploadedFile[];
    ownerSignature?: UploadedFile;
    veterinarianSignature?: UploadedFile;
    pdfForm?: UploadedFile;
};

/**
 * A submission's workflow status.
 *
 * @remarks
 * `"unpaid"` is never written to `Submission.status` itself - it's a derived,
 * admin-facing override produced by `getAdminCaseDisplayStatus` (`lib/status.ts`)
 * whenever `billing.paymentStatus` is `"unpaid"`, regardless of the real underlying
 * status. It's included in this union only because that function's return type needs to
 * express "all real statuses, plus this override" as one type.
 */
export type SubmissionStatus =
    | "unpaid"
    | "pendingReview"
    | "reviewing"
    | "draft"
    | "completed"
    | "archived";


export type CaseSubmissionSortOrder = "newest" | "oldest";
    