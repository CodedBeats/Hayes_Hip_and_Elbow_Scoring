// types
import { Submission, SubmissionStatus } from "@/types/submission";

/**
 * Derives the status an admin sees for a case, overriding the real workflow status
 * while payment is outstanding.
 *
 * @remarks
 * `"unpaid"` is a derived display status, not one admin (or any code) ever sets
 * directly on `submission.status` - it overrides whatever the real workflow status is
 * until `billing.paymentStatus` moves off `"unpaid"`. Any UI branching on case status
 * for admin-facing views should go through this function rather than reading
 * `submission.status` directly, or it'll show a case as e.g. "pendingReview" when the
 * customer hasn't actually paid yet.
 */
export const getAdminCaseDisplayStatus = (
    submission: Pick<Submission, "status" | "billing">
): SubmissionStatus => submission.billing.paymentStatus === "unpaid" ? "unpaid" : submission.status;
