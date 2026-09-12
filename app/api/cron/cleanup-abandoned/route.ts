import { NextResponse } from "next/server";
import { getStaleUnpaidSubmissions, deleteSubmissionDoc } from "@/lib/firebaseAdmin";
import { deleteObjects, collectFileKeys } from "@/lib/s3";

// Matches cleanup-drafts's window - a customer who cancels and comes back a week later
// has typically already re-uploaded and started a fresh submission anyway.
const STALE_AFTER_DAYS = 7;

/**
 * Deletes submissions stuck at `pendingReview` + `unpaid` (an abandoned or failed Stripe
 * checkout) - and their S3 files - after 7+ days untouched. Runs on a Vercel Cron
 * schedule.
 *
 * @remarks
 * `createSubmission` (`lib/firebase.ts`) writes one Firestore doc per dog *before* the
 * Stripe redirect, at `status: "pendingReview"`, `billing.paymentStatus: "unpaid"`. If
 * the customer then cancels at the Stripe page, is declined, or just closes the tab,
 * that doc is never `"draft"` - so `cleanup-drafts` never sweeps it - and never gets
 * paid, so nothing else reconciles it either. Left alone, it sits in `/admin` forever as
 * a pending case nobody will ever score, with its S3 files orphaned alongside it. This
 * route is the other half of `cleanup-drafts`, closing that gap.
 *
 * Deliberately its own file/route rather than folded into `cleanup-drafts` - see that
 * route's header comment on why one cron job's failure should never be able to take
 * another down with it. Shares the same bearer-token auth, the same S3-then-Firestore
 * delete ordering (safer to be left with a doc pointing at already-deleted files than
 * orphaned S3 files with no Firestore record), and the same response shape.
 *
 * The query itself ({@link getStaleUnpaidSubmissions}) is guarded tightly on
 * `paymentStatus == "unpaid"` specifically - a `"pending"` (unpaid invoice), `"paid"`,
 * or `"test"` submission is never eligible, regardless of `updatedAt`.
 */
export async function GET(request: Request) {
    // Vercel automatically sends this header on scheduled invocations when
    // CRON_SECRET is set as an env var for the project.
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const staleSubmissions = await getStaleUnpaidSubmissions(cutoff);

    const deletedIds: string[] = [];
    for (const submission of staleSubmissions) {
        await deleteObjects(collectFileKeys(submission.files));
        await deleteSubmissionDoc(submission.id);
        console.log(`[cleanup-abandoned] deleted abandoned submission ${submission.id}`);
        deletedIds.push(submission.id);
    }

    return NextResponse.json({ deletedCount: deletedIds.length, deletedIds });
}
