import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
    getFirestore,
    Timestamp,
    type Firestore,
    type QueryDocumentSnapshot,
    type DocumentSnapshot,
    type DocumentData,
} from "firebase-admin/firestore";
import type { Submission, SubmissionStatus, Files } from "../types/submission";
import type { OwnerDetails } from "../types/owner";
import type { VeterinarianDetails } from "../types/vet";
import type { DogCase } from "../types/dog";
import type { UploadedFile } from "../types/upload";

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

const getAdminDb = (): Firestore => {
    if (adminDb) return adminDb;

    // Private keys pasted into .env come through with literal "\n" escape sequences
    // instead of real newlines - PEM parsing fails unless they're converted back.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    // Next.js dev hot-reload re-evaluates modules repeatedly; initializeApp() throws if
    // called more than once, so reuse the existing app when present.
    const app = getApps().length
        ? getApp()
        : initializeApp({
              credential: cert({
                  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey,
              }),
          });

    adminDb = getFirestore(app);
    return adminDb;
};

// ============================================= //
// === Firestore document -> Submission type === //
// ============================================= //
//
// createSubmission() (lib/firebase.ts) writes two different on-disk shapes depending
// on submissionType, and NEITHER is a 1:1 match for the `Submission` type - everything
// below exists to bridge that gap back into something type-safe to render.

// createSubmission() writes createdAt/updatedAt/invoiceSentAt as plain JS Date objects,
// but Firestore auto-boxes any Date into a Timestamp on write. So every read gets back
// a Timestamp (with .toDate()), never a Date, even though the types say Date. Falling
// back to `new Date(value)` covers a doc ever hand-edited in the console as a string.
const toDate = (value: unknown): Date => {
    if (value instanceof Timestamp) return value.toDate();
    return new Date(value as string | number | Date);
};

// The upload route (app/api/upload-url/route.ts) writes S3 keys shaped like
// `submissions/{id}/dog{n}/{category}/{uuid}-{originalFileName}` - Firestore only ever
// stores that key string, never the original fileName/size/contentType/uploadedAt. This
// is a best-effort parse to recover a human-readable name; it's intentionally NOT
// S3-backed (no network call), so it's cheap enough to build for every row on the list
// pages. Real metadata + a working download URL are backfilled later, only for the
// single-case page (see lib/s3.ts's enrichUploadedFile) - never here, since paying an S3
// round-trip per file on every list-page load would be pure waste.
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

const mapSubmissionDoc = (
    docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Submission => {
    const data = docSnap.data();
    if (!data) {
        throw new Error(`Submission document ${docSnap.id} has no data`);
    }

    const createdAt = toDate(data.createdAt);
    const updatedAt = data.updatedAt ? toDate(data.updatedAt) : undefined;

    const billing = {
        ...data.billing,
        // billing.invoiceSentAt has the exact same Timestamp-vs-Date mismatch as
        // createdAt/updatedAt, just nested one level deeper - easy to miss.
        invoiceSentAt: data.billing?.invoiceSentAt ? toDate(data.billing.invoiceSentAt) : undefined,
    };

    let owner: OwnerDetails;
    let veterinarian: VeterinarianDetails;
    let dog: DogCase;
    let files: Files;

    if (data.submissionType === "pdf") {
        // The PDF submission flow never captures structured owner/dog/vet data - the
        // fields literally named "owner"/"veterinarian" on these docs are actually just
        // a signature file's S3 key (a string), or null, not real detail objects. This
        // is expected behaviour of that flow (confirmed), not a bug: everything the
        // owner/vet filled in only exists inside the attached PDF form file itself.
        //
        // The placeholder objects below exist ONLY to satisfy the Submission type's
        // required owner/veterinarian/dog fields - their field VALUES are never shown to
        // anyone. The UI (CasesTable, the case-details page) always checks
        // submissionType === "pdf" first and renders a "see attached PDF form" notice
        // instead of reading these fields, so garbage-in here is intentional and safe.
        owner = { name: "", email: "", phone: "", address: "", memberNumber: "" };
        veterinarian = {
            veterinarianName: "",
            practiceName: "",
            address: "",
            phone: "",
            positiveIdentificationSighted: false,
            certificateOfRegistrationSighted: false,
        };
        dog = {
            id: docSnap.id,
            examType: "hipsAndElbows", // arbitrary valid placeholder, never displayed
            isDogsAustraliaRegistered: false,
            registeredName: "",
            microchipNumber: "",
            breed: "",
            sex: "male",
            dateOfBirth: "",
            dateOfRadiograph: "",
        };

        const ownerSignatureKey: string | null = typeof data.owner === "string" ? data.owner : null;
        const vetSignatureKey: string | null = typeof data.veterinarian === "string" ? data.veterinarian : null;

        files = {
            dicomFiles: (data.dog?.dicomFilesRef ?? []).map(keyToUploadedFileStub),
            supportingDocuments: (data.dog?.supportingDocumentsRef ?? []).map(keyToUploadedFileStub),
            ownerSignature: ownerSignatureKey ? keyToUploadedFileStub(ownerSignatureKey) : undefined,
            veterinarianSignature: vetSignatureKey ? keyToUploadedFileStub(vetSignatureKey) : undefined,
            pdfForm: data.pdfFormRef ? keyToUploadedFileStub(data.pdfFormRef) : undefined,
        };
    } else {
        // "Online" submissions store real owner/veterinarian/dog objects, but each has
        // one extra ref field bolted on by createSubmission() that isn't part of the
        // real OwnerDetails/VeterinarianDetails/DogCase types. Build the clean typed
        // object explicitly field-by-field (rather than spreading the raw doc data and
        // deleting the ref field) so a future field added to these types can't silently
        // leak an unexpected extra property through untyped Firestore data.
        const rawOwner = data.owner ?? {};
        owner = {
            name: rawOwner.name ?? "",
            email: rawOwner.email ?? "",
            phone: rawOwner.phone ?? "",
            address: rawOwner.address ?? "",
            memberNumber: rawOwner.memberNumber ?? "",
        };

        const rawVet = data.veterinarian ?? {};
        veterinarian = {
            veterinarianName: rawVet.veterinarianName ?? "",
            practiceName: rawVet.practiceName ?? "",
            address: rawVet.address ?? "",
            phone: rawVet.phone ?? "",
            positiveIdentificationSighted: Boolean(rawVet.positiveIdentificationSighted),
            certificateOfRegistrationSighted: Boolean(rawVet.certificateOfRegistrationSighted),
        };

        const rawDog = data.dog ?? {};
        dog = {
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
            dateOfRadiograph: rawDog.dateOfRadiograph ?? "",
        };

        files = {
            dicomFiles: (rawDog.dicomFilesRef ?? []).map(keyToUploadedFileStub),
            supportingDocuments: (rawDog.supportingDocumentsRef ?? []).map(keyToUploadedFileStub),
            ownerSignature: rawOwner.ownerSignatureRef ? keyToUploadedFileStub(rawOwner.ownerSignatureRef) : undefined,
            veterinarianSignature: rawVet.vetSignatureRef ? keyToUploadedFileStub(rawVet.vetSignatureRef) : undefined,
            pdfForm: undefined, // never present for online submissions
        };
    }

    return {
        id: docSnap.id,
        status: data.status as SubmissionStatus,
        submitterType: data.submitterType,
        submitterId: data.submitterId,
        submissionType: data.submissionType,
        createdAt,
        updatedAt,
        owner,
        veterinarian,
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

// ==================================== //
// === DRAFT CLEANUP (cron-facing) === //
// ==================================== //
//
// Used only by app/api/cron/cleanup-drafts. Draft docs (written by
// lib/firebase.ts's saveDraftFiles, before a dog is ever marked complete) don't have the
// full owner/veterinarian/dog shape mapSubmissionDoc expects - they may only ever contain
// { s3SubmissionId, dogIndex, submissionType, status, files, createdAt, updatedAt } - so
// they're read and returned as-is here rather than routed through mapSubmissionDoc.

export type StaleDraft = {
    id: string;
    files: Files;
};

// Requires a composite index on `submissions` (status ASC, updatedAt ASC) - Firestore
// will throw with a direct console link to create it the first time this runs without
// one. See the cron route's header comment for the one-time setup steps.
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

export const deleteSubmissionDoc = async (id: string): Promise<void> => {
    await getAdminDb().doc(`submissions/${id}`).delete();
};
