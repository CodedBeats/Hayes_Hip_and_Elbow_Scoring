// types
import { Submission, SubmissionStatus } from "@/types/submission";

// "unpaid" is a derived display status, not one admin sets directly - it overrides
// the real workflow status until billing.paymentStatus moves off "unpaid".
export const getAdminCaseDisplayStatus = (
    submission: Pick<Submission, "status" | "billing">
): SubmissionStatus => submission.billing.paymentStatus === "unpaid" ? "unpaid" : submission.status;
