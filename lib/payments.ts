// dependencies
import { FieldValue } from "firebase-admin/firestore";
// services
import { getAdminDb } from "@/lib/firebaseAdmin";
// types
import type { PaymentStatus } from "@/types/billing";

/**
 * Marks one or more submission docs as paid (or `test` for the admin-test flow),
 * server-side, via the Admin SDK.
 *
 * @remarks
 * The sole writer of `billing.paymentStatus` for Stripe-billed submissions. Called by
 * both channels of the payment-confirmation flow - the signed webhook
 * (`app/api/webhooks/stripe`, the guarantee) and the redirect fast-path
 * (`app/api/verify-payment`, instant feedback). Both verify against Stripe before
 * calling this.
 *
 * Idempotent: re-writing the same status is effectively a no-op, so it does not matter
 * which channel wins the race or whether Stripe redelivers the webhook.
 *
 * Uses `.update()` rather than `.set(..., { merge: true })` on purpose - the doc is
 * always created (by `createSubmission`) before the Stripe redirect, so a missing doc
 * here is a real bug that should surface as a failed write, not be silently stubbed.
 *
 * @param stripePaymentIntentId - Persisted to `billing.stripePaymentIntentId` when
 * present. Absent for $0 admin-test sessions (fully covered by the 100%-off coupon, no
 * PaymentIntent is created).
 */
export const markSubmissionsPaid = async (
    submissionIds: string[],
    status: Extract<PaymentStatus, "paid" | "test">,
    stripePaymentIntentId?: string | null,
): Promise<void> => {
    const db = getAdminDb();

    await Promise.all(
        submissionIds.map((id) => {
            const update: Record<string, unknown> = {
                "billing.paymentStatus": status,
                updatedAt: FieldValue.serverTimestamp(),
            };
            if (stripePaymentIntentId) {
                update["billing.stripePaymentIntentId"] = stripePaymentIntentId;
            }
            return db.doc(`submissions/${id}`).update(update);
        }),
    );
};
