import { type OwnerDetails } from './owner';
import { type ClinicInfo } from './clinic';
import { type BillingInfo } from "./billing";
import { type DogCase } from "./dog";
import { UploadedFile } from './upload';


export type Submission = {
    id?: string;

    status: SubmissionStatus;

    submitterType: "owner" | "clinic";
    submitterId?: string; // future clinic account
    clinicInfo?: ClinicInfo; // present only when submitterType === "clinic"
    payer: "owner" | "clinic"; // per-dog; who is being billed for this dog

    createdAt: Date;
    updatedAt?: Date;


    // main 2 field sections
    owner: OwnerDetails;

    dog: DogCase;


    // all files
    files: Files;


    // archiving
    archived: boolean;
    archivedAt?: Date;
    archivedBy: string; // e.g. "admin"


    billing: BillingInfo;
};

/**
 * Uploaded S3 files for one dog. `pdfForm` (the signed submission form) is required for
 * every dog.
 */
export type Files = {
    dicomFiles: UploadedFile[];
    supportingDocuments: UploadedFile[];
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
    | "completed";


export type CaseSubmissionSortOrder = "newest" | "oldest";
    