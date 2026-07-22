import { NextResponse } from "next/server";
import { getStaleDraftSubmissions, deleteSubmissionDoc } from "@/lib/firebaseAdmin";
import { deleteObjects } from "@/lib/s3";
import type { Files } from "@/types/submission";

// Drafts untouched for this long are considered abandoned. Chosen to comfortably
// outlast a customer just taking a break mid-form (localStorage keeps their
// in-progress form data around indefinitely anyway) while not leaving paid-for
// storage costs accruing on files nobody will ever finish submitting.
const STALE_AFTER_DAYS = 7;

// Pulls every S3 key referenced by a draft's files object, across all the
// upload categories DogEntry.tsx can produce (some may be absent depending on
// online vs pdf mode and how far the customer got).
const collectFileKeys = (files: Files): string[] => {
    const keys: string[] = [
        ...files.dicomFiles.map((f) => f.key),
        ...files.supportingDocuments.map((f) => f.key),
    ];
    if (files.pdfForm) keys.push(files.pdfForm.key);
    if (files.ownerSignature) keys.push(files.ownerSignature.key);
    if (files.veterinarianSignature) keys.push(files.veterinarianSignature.key);
    return keys;
};

/**
 * Deletes draft submissions (and their S3 files) that have sat untouched for 7+ days.
 * Runs on a Vercel Cron schedule.
 *
 * @remarks
 * A customer can upload DICOM files / signatures for a dog (they land in S3
 * immediately - see `DogEntry.tsx`'s `handleUploadAll`) and then just... leave, without
 * ever clicking "Mark Dog Complete" or paying. `saveDraftFiles` (`lib/firebase.ts`)
 * writes a Firestore doc with status "draft" the moment the first file for a dog is
 * uploaded, specifically so that scenario is trackable. This route is the other half of
 * that: it finds drafts that haven't been touched (no new file, no "Mark Complete") in
 * `STALE_AFTER_DAYS`+ days and deletes both the Firestore doc AND the S3 objects it
 * points to, so abandoned uploads don't sit in the bucket forever.
 *
 * A completed + paid (or even completed-but-unpaid) submission is never "draft" status
 * by the time this runs - `createSubmission` (`lib/firebase.ts`) flips it to
 * "pendingReview" at checkout - so this route can never delete a real, paid-for
 * submission. It only ever touches genuinely abandoned drafts.
 *
 * `vercel.json` declares a schedule (currently daily at 03:00 UTC) pointing at this
 * route's path. Vercel's platform calls it directly - there's no queue, no separate
 * worker, just an HTTP GET on schedule. To stop randoms on the internet from triggering
 * this and mass-deleting drafts early, Vercel signs every cron invocation with a bearer
 * token equal to your `CRON_SECRET` env var, checked below. See the repo's plan notes /
 * README for the one-time Vercel dashboard + env var setup this route needs before it'll
 * actually run.
 *
 * Adding a second cron job later (e.g. reminder emails): put it in its OWN file, e.g.
 * `app/api/cron/send-reminder-emails/route.ts`, with its OWN entry in `vercel.json`'s
 * `crons` array. Do NOT bolt more work onto this handler - Vercel invokes each cron path
 * independently and logs each one separately, so keeping jobs in separate files/routes
 * means one job's failure (or timeout) can never silently take another down with it.
 * Note: `RESEND_API_KEY` already exists (currently empty) in `.env.local`, which
 * suggests Resend was the originally intended provider for that email job whenever it
 * gets built.
 */
export async function GET(request: Request) {
    // Vercel automatically sends this header on scheduled invocations when
    // CRON_SECRET is set as an env var for the project.
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const staleDrafts = await getStaleDraftSubmissions(cutoff);

    const deletedIds: string[] = [];
    for (const draft of staleDrafts) {
        // Delete the S3 objects before the Firestore doc - if this crashes partway,
        // it's far safer to be left with a "draft" doc pointing at already-deleted
        // files (harmless, cleaned up next run) than S3 files with no Firestore
        // record of them ever existing, which is the exact problem this job exists
        // to prevent.
        await deleteObjects(collectFileKeys(draft.files));
        await deleteSubmissionDoc(draft.id);
        deletedIds.push(draft.id);
    }

    return NextResponse.json({ deletedCount: deletedIds.length, deletedIds });
}
