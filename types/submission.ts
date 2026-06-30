import { type SubmitterDetails } from './submitter';
import { type BillingInfo } from "./billing";
import { type DogCase,  } from "./dog";


export type Submission = {
    id?: string;

    status: SubmissionStatus;

    createdAt: Date;
    updatedAt?: Date;

    submitterType: "owner" | "clinic";
    submissionType: "online" | "pdf";

    submitterId?: string; // future clinic account

    dogs: DogCase[];

    billing: BillingInfo;

    submittedBy: SubmitterDetails;
};

export type SubmissionStatus =
    | "draft"
    | "submitted"
    | "pendingReview"
    | "reviewing"
    | "completed"
    | "archived";