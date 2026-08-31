// dependencies
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
    getFirestore,
    Timestamp,
    type Firestore,
    type QueryDocumentSnapshot,
    type DocumentSnapshot,
    type DocumentData,
} from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
// types
import type { Submission, SubmissionStatus, Files } from "../types/submission";
import type { OwnerDetails } from "../types/owner";
import type { ClinicInfo } from "../types/clinic";
import type { DogCase } from "../types/dog";
import type { UploadedFile } from "../types/upload";
// eslint-disable-next-line -- referenced only via TSDoc {@link} for docs generation
import { createSubmission } from '@/lib/firebase';

// Server-only Firestore access via a service account, bypassing client-side
// security rules entirely. This must NEVER be imported from a client component -
// firebase-admin is not browser-safe and doesn't need to be, since only trusted
// server code (the admin dashboard's Server Components) reads through this file.
// (lib/firebase.ts is imported by client components like SignInForm/SubmissionFlow,
// which is exactly why this lives in a separate file instead of alongside it.)
//
// Requires FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (from the same service
// account JSON, Firebase console -> Project Settings -> Service Accounts) in
// addition to the existing NEXT_PUBLIC_FIREBASE_PROJECT_ID.

// Initialization is lazy (only runs on first real use, via getAdminDb() below) rather
// than at module load time. Next.js imports every route module during `next build` to
// collect its config (page metadata, `dynamic` exports, etc.) even for routes marked
// force-dynamic - if credential setup ran eagerly here, a missing/invalid service
// account would fail the build itself, not just a request.
let adminDb: Firestore | undefined;

/**
 * Lazily initializes (or reuses) the Admin SDK app.
 *
 * @remarks
 * Initialization is lazy (only runs on first real use) rather than at module load time.
 * Next.js imports every route module during `next build` to collect its config (page
 * metadata, `dynamic` exports, etc.) even for routes marked `force-dynamic` - if
 * credential setup ran eagerly at the top of this file, a missing/invalid service
 * account would fail the build itself, not just a request.
 */
const getAdminApp = () => {
    // Private keys pasted into .env come through with literal "\n" escape sequences
    // instead of real newlines - PEM parsing fails unless they're converted back.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    // Next.js dev hot-reload re-evaluates modules repeatedly; initializeApp() throws if
    // called more than once, so reuse the existing app when present.
    return getApps().length
        ? getApp()
        : initializeApp({
              credential: cert({
                  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey,
              }),
          });
};

const getAdminDb = (): Firestore => {
    if (adminDb) return adminDb;
    adminDb = getFirestore(getAdminApp());
    return adminDb;
};

/**
 * Verifies a Firebase ID token server-side and returns the decoded token if valid.
 *
 * @remarks
 * This is the real authentication boundary for admin-only server actions (e.g. the
 * admin-test checkout flow in `app/api/create-checkout-session/route.ts`) - a
 * client-side `useAuth()` check only hides UI, it doesn't stop someone from calling the
 * API route directly. Throws if the token is missing, expired, or otherwise invalid.
 */
export const verifyAdminToken = async (idToken: string) =>
    getAuth(getAdminApp()).verifyIdToken(idToken);


// ============================================= //
// === Firestore document -> Submission type === //
// ============================================= //
//
// createSubmission() (lib/firebase.ts) writes owner/dog as real structured objects
// plus one extra ref field bolted onto `dog` - everything below exists to bridge that
// gap back into something type-safe to render.

/**
 * Coerces a raw Firestore field value back into a `Date`.
 *
 * @remarks
 * {@link createSubmission} writes `createdAt`/`updatedAt`/`invoiceSentAt` as plain JS
 * `Date` objects, but Firestore auto-boxes any `Date` into a `Timestamp` on write. So
 * every read gets back a `Timestamp` (with `.toDate()`), never a `Date`, even though the
 * types say `Date`. Falling back to `new Date(value)` covers a doc ever hand-edited in
 * the console as a string.
 */
const toDate = (value: unknown): Date => {
    if (value instanceof Timestamp) return value.toDate();
    return new Date(value as string | number | Date);
};

/**
 * Builds a best-effort `UploadedFile` stub from just an S3 key, with no network call.
 *
 * @remarks
 * The upload route (`app/api/upload-url/route.ts`) writes S3 keys shaped like
 * `submissions/{id}/dog{n}/{category}/{uuid}-{originalFileName}` - Firestore only ever
 * stores that key string, never the original fileName/size/contentType/uploadedAt. This
 * is a best-effort parse to recover a human-readable name; it's intentionally NOT
 * S3-backed, so it's cheap enough to build for every row on the list pages. Real
 * metadata and a working download URL are backfilled later, only for the single-case
 * page (see {@link enrichUploadedFile} in `lib/s3.ts`) - never here, since paying an S3
 * round-trip per file on every list-page load would be pure waste.
 */
const keyToUploadedFileStub = (key: string): UploadedFile => {
    const lastSegment = key.split("/").pop() ?? key;
    const fileName = lastSegment.replace(/^[0-9a-f-]{36}-/i, "");
    return {
        key,
        fileName,
        size: 0,
        contentType: "",
        uploadedAt: new Date(0),
        url: undefined,
    };
};

/**
 * Bridges a raw Firestore submission doc back into a typed `Submission`.
 *
 * @remarks
 * {@link createSubmission} (`lib/firebase.ts`) stores real `owner`/`dog` objects with
 * one extra ref field bolted onto `dog` that isn't part of the real `DogCase` type, plus
 * a top-level `pdfFormRef`. Build the clean typed object explicitly field-by-field
 * (rather than spreading the raw doc data) so a future field added to these types can't
 * silently leak an unexpected extra property through untyped Firestore data.
 *
 * @throws Error if the document snapshot has no data (i.e. it doesn't exist).
 */
const mapSubmissionDoc = (
    docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Submission => {
    const data = docSnap.data();
    if (!data) {
        throw new Error(`Submission document ${docSnap.id} has no data`);
    }

    const createdAt = toDate(data.createdAt);
    const updatedAt = data.updatedAt ? toDate(data.updatedAt) : undefined;

    const archived: boolean = data.archived;
    const archivedAt: Date | undefined = data.archivedAt ? toDate(data.archivedAt) : undefined;
    const archivedBy: string = data.archivedBy;

    const billing = {
        ...data.billing,
        // billing.invoiceSentAt has the exact same Timestamp-vs-Date mismatch as
        // createdAt/updatedAt, just nested one level deeper - easy to miss.
        invoiceSentAt: data.billing?.invoiceSentAt ? toDate(data.billing.invoiceSentAt) : undefined,
    };

    const rawOwner = data.owner ?? {};
    const owner: OwnerDetails = {
        name: rawOwner.name ?? "",
        email: rawOwner.email ?? "",
        phone: rawOwner.phone ?? "",
        address: rawOwner.address ?? "",
        memberNumber: rawOwner.memberNumber ?? "",
    };

    const clinicInfo: ClinicInfo | undefined = data.clinicInfo
        ? {
            clinicName: data.clinicInfo.clinicName ?? "",
            contactName: data.clinicInfo.contactName ?? "",
            email: data.clinicInfo.email ?? "",
            phone: data.clinicInfo.phone ?? "",
        }
        : undefined;

    const rawDog = data.dog ?? {};
    const dog: DogCase = {
        id: docSnap.id,
        examType: rawDog.examType,
        isDogsAustraliaRegistered: Boolean(rawDog.isDogsAustraliaRegistered),
        registeredName: rawDog.registeredName ?? "",
        // written as `dog.registeredNumber ?? null` by createSubmission, so `null`
        // needs coercing back to `undefined` to match DogCase.registeredNumber?: string
        registeredNumber: rawDog.registeredNumber ?? undefined,
        microchipNumber: rawDog.microchipNumber ?? "",
        breed: rawDog.breed ?? "",
        sex: rawDog.sex,
        dateOfBirth: rawDog.dateOfBirth ?? "",
    };

    const files: Files = {
        dicomFiles: (rawDog.dicomFilesRef ?? []).map(keyToUploadedFileStub),
        supportingDocuments: (rawDog.supportingDocumentsRef ?? []).map(keyToUploadedFileStub),
        pdfForm: data.pdfFormRef ? keyToUploadedFileStub(data.pdfFormRef) : undefined,
    };

    return {
        id: docSnap.id,
        status: data.status as SubmissionStatus,
        submitterType: data.submitterType,
        submitterId: data.submitterId,
        clinicInfo,
        payer: data.payer,
        createdAt,
        updatedAt,
        archived,
        archivedAt,
        archivedBy,
        owner,
        dog,
        files,
        billing,
    };
};

export const getAllSubmissions = async (): Promise<Submission[]> => {
    const snapshot = await getAdminDb().collection("submissions").get();
    return snapshot.docs.map(mapSubmissionDoc);
};

export const getSubmissionById = async (id: string): Promise<Submission | null> => {
    const docSnap = await getAdminDb().doc(`submissions/${id}`).get();
    if (!docSnap.exists) return null;
    return mapSubmissionDoc(docSnap);
};


// ======================================================= //
// === DEPRECATED TEST DATA (migrated out of `submissions`) === //
// ======================================================= //
//
// `testSubmissions` holds every submission doc that existed before real cases went
// live - all of it test data from development, moved out via
// `scripts/migrateTestSubmissions.ts` so it no longer shows up alongside real cases on
// the main dashboard/pending-reviews/archive pages. See `/admin/test-data`.

/** @see {@link getAllSubmissions} - same shape, reads `testSubmissions` instead. */
export const getTestSubmissions = async (): Promise<Submission[]> => {
    const snapshot = await getAdminDb().collection("testSubmissions").get();
    return snapshot.docs.map(mapSubmissionDoc);
};

/** @see {@link getSubmissionById} - same shape, reads `testSubmissions` instead. */
export const getTestSubmissionById = async (id: string): Promise<Submission | null> => {
    const docSnap = await getAdminDb().doc(`testSubmissions/${id}`).get();
    if (!docSnap.exists) return null;
    return mapSubmissionDoc(docSnap);
};


// ==================================== //
// === DRAFT CLEANUP (cron-facing) === //
// ==================================== //
//
// Used only by app/api/cron/cleanup-drafts. Draft docs (written by
// lib/firebase.ts's saveDraftFiles, before a dog is ever marked complete) don't have the
// full owner/dog shape mapSubmissionDoc expects - they may only ever contain
// { s3SubmissionId, dogIndex, status, files, createdAt, updatedAt } - so they're read
// and returned as-is here rather than routed through mapSubmissionDoc.

export type StaleDraft = {
    id: string;
    files: Files;
};

/**
 * Finds draft submissions that haven't been touched since before `updatedBefore`.
 *
 * @remarks
 * Requires a composite index on `submissions` (`status` ASC, `updatedAt` ASC) -
 * Firestore will throw with a direct console link to create it the first time this runs
 * without one. See the header comment in `app/api/cron/cleanup-drafts/route.ts` (the
 * only caller) for the one-time setup steps.
 *
 * @param updatedBefore - Drafts whose `updatedAt` is older than this are considered
 * stale and returned.
 */
export const getStaleDraftSubmissions = async (updatedBefore: Date): Promise<StaleDraft[]> => {
    const snapshot = await getAdminDb()
        .collection("submissions")
        .where("status", "==", "draft")
        .where("updatedAt", "<", Timestamp.fromDate(updatedBefore))
        .get();

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        files: (docSnap.data().files ?? {}) as Files,
    }));
};

/**
 * Deletes a document from firestore
 * 
 * @remarks
 * This is used as the last step in the draft-cleaup process by `app/api/cron/cleanup-drafts`
 * to delete all docs from firestore after their asociated files are deleted first.
 */
export const deleteSubmissionDoc = async (id: string): Promise<void> => {
    await getAdminDb().doc(`submissions/${id}`).delete();
};
