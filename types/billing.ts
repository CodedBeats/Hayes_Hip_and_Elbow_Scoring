export type BillingInfo = {
    billingType: "payNow" | "invoice";

    amount: number;

    paymentStatus: PaymentStatus;

    stripePaymentIntentId?: string;

    invoiceId?: string;

    invoiceSentAt?: Date;
};

/**
 * A submission's real payment state.
 *
 * @remarks
 * Distinct from `SubmissionStatus`'s `"unpaid"` value - this is the actual field stored
 * at `Submission.billing.paymentStatus`, and it's what `getAdminCaseDisplayStatus`
 * (`lib/status.ts`) reads to decide whether to override the workflow status for admin
 * display.
 */
export type PaymentStatus =
    | "unpaid"
    | "pending"
    | "paid"
    | "invoiced"
    | "overdue";
