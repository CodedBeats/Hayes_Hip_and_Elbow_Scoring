// firebase dependencies
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
// types
import type { Submission, SubmissionStatus, Files } from "../types/submission";
import type { OwnerDetails } from "../types/owner";
import type { VeterinarianDetails } from "../types/vet";
import type { DogCase } from "../types/dog";
import type { BillingInfo, PaymentStatus } from "../types/billing";

// config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// init firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

// ============ //
// === AUTH === //
// ============ //

export const signIn = async (email: string, password: string) => {
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
};

export const signOutUser = () => {
    signOut(auth);
};


// ===================== //
// === SUBMISSIONS ==== //
// ===================== //

type CreateSubmissionPayload = {
    s3SubmissionId: string;
    dogIndex: number;
    submissionType: string;
    owner: OwnerDetails;
    veterinarian: VeterinarianDetails;
    dog: DogCase;
    files: Files;
    billing: BillingInfo;
};

/**
 * Builds the deterministic Firestore doc ID for one dog within a submission.
 *
 * @remarks
 * One Firestore doc per dog, but the ID is deterministic (not Firestore's random
 * `addDoc` ID) so that a "draft" write made while files are still uploading (see
 * {@link saveDraftFiles}) and the final "pendingReview" write made at checkout
 * (see {@link createSubmission}) land on the SAME document instead of creating a
 * duplicate.
 */
const getSubmissionDraftId = (s3SubmissionId: string, dogIndex: number): string =>
    `${s3SubmissionId}_dog${dogIndex}`;

/**
 * Writes (or upserts) a "draft" submission doc as soon as a dog's files start landing
 * in S3, well before the dog is marked complete or checkout starts.
 *
 * @remarks
 * Called as soon as a dog's first file successfully lands in S3 (from `DogEntry`'s
 * `handleUploadAll`). Without this, a customer who uploads files and abandons the form
 * leaves S3 objects with zero Firestore record - nothing to know they exist or to clean
 * them up later. Writing a "draft" doc here means every S3 upload always has a
 * corresponding Firestore doc from the moment it happens, and the scheduled cleanup job
 * (`app/api/cron/cleanup-drafts/route.ts`) only ever has to query Firestore, never
 * reconcile against a live S3 listing.
 *
 * `createdAt` is only stamped on the very first write for this dog - if every upload
 * batch reset it, the cleanup job's "how old is this draft" check would only ever see
 * the age of the most recent upload, never how long the submission has truly existed.
 * `updatedAt` (always stamped) is what cleanup actually keys off, since it needs to know
 * when the customer last did anything at all, not when the doc first existed.
 *
 * Firestore's `setDoc` rejects explicit `undefined` field values (unlike a merge that
 * simply omits a key) - `pdfForm`/`ownerSignature`/`veterinarianSignature` are undefined
 * whenever a dog hasn't uploaded that particular file yet, so they're left out of the
 * write entirely rather than passed straight through.
 *
 * Safe to call repeatedly (every upload batch) - `setDoc` with `merge: true` just layers
 * the new file keys on top of whatever was written last time, keyed by the same
 * deterministic ID (see `getSubmissionDraftId` above).
 */
export const saveDraftFiles = async (
    s3SubmissionId: string,
    dogIndex: number,
    submissionType: string,
    files: Files,
): Promise<void> => {
    const draftRef = doc(db, "submissions", getSubmissionDraftId(s3SubmissionId, dogIndex));

    // Only stamp createdAt on the very first write for this dog - if every upload batch
    // reset it, the cron job's "how old is this draft" check would only ever see the age
    // of the most recent upload, never how long the submission has truly existed.
    // updatedAt (always stamped below) is what cleanup actually keys off, since it needs
    // to know when the customer last did anything at all, not when the doc first existed.
    const existing = await getDoc(draftRef);

    // Firestore's setDoc rejects explicit `undefined` field values (unlike a merge that
    // simply omits a key) - pdfForm/ownerSignature/veterinarianSignature are undefined
    // whenever a dog hasn't uploaded that particular file yet (e.g. any "online" mode dog
    // has no pdfForm at all), so they must be left out of the write entirely rather than
    // passed straight through.
    const definedFiles: Partial<Files> = {
        dicomFiles: files.dicomFiles,
        supportingDocuments: files.supportingDocuments,
        ...(files.pdfForm ? { pdfForm: files.pdfForm } : {}),
        ...(files.ownerSignature ? { ownerSignature: files.ownerSignature } : {}),
        ...(files.veterinarianSignature ? { veterinarianSignature: files.veterinarianSignature } : {}),
    };

    await setDoc(
        draftRef,
        {
            s3SubmissionId,
            dogIndex,
            submissionType,
            status: "draft",
            files: definedFiles,
            updatedAt: serverTimestamp(),
            ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
    );
};

/**
 * Creates (or upserts, if a draft already exists from {@link saveDraftFiles}) one
 * Firestore submission document per dog (though many may share the same
 * `s3SubmissionId`).
 *
 * @remarks
 * Writes one of two structurally different on-disk shapes depending on
 * `submissionType` ("online" vs "pdf") - see `mapSubmissionDoc` in
 * `lib/firebaseAdmin.ts`, which is what reconstructs a typed `Submission` back out of
 * whichever shape was written here.
 */
export const createSubmission = async (payload: CreateSubmissionPayload): Promise<string> => {

    // get payload
    const {
        s3SubmissionId,
        dogIndex,
        submissionType,
        owner,
        veterinarian,
        dog,
        files,
        billing, // billing.paymentStatus always starts as "unpaid"
    } = payload;

    const docRef = doc(db, "submissions", getSubmissionDraftId(s3SubmissionId, dogIndex));

    // handle difference between online and pdf submission types
    if (submissionType === "pdf") {
        // create submission with just files
        await setDoc(docRef, {
            s3SubmissionId,
            dogIndex,
            status: "pendingReview",
            submitterType: "anon",
            submissionType,
            createdAt: new Date(),
            updatedAt: serverTimestamp(),
            billing,
            pdfFormRef: files.pdfForm?.key ?? null,
            // owner and vet fields just become refs to signatures
            owner: files.ownerSignature?.key ?? null,
            veterinarian: files.veterinarianSignature?.key ?? null,
            dog: {
                dicomFilesRef: files.dicomFiles.map((f) => f.key),
                supportingDocumentsRef: files.supportingDocuments.map((f) => f.key),
            },
        }, { merge: true });

        return docRef.id;

    } else {
        // create submission with all form fields and files
        await setDoc(docRef, {
            s3SubmissionId,
            dogIndex,
            status: "pendingReview",
            submitterType: "anon",
            submissionType,
            createdAt: new Date(),
            updatedAt: serverTimestamp(),
            billing,
            owner: {
                ...owner,
                ownerSignatureRef: files.ownerSignature?.key ?? null,
            },
            veterinarian: {
                ...veterinarian,
                vetSignatureRef: files.veterinarianSignature?.key ?? null,
            },
            dog: {
                ...dog,
                registeredNumber: dog.registeredNumber ?? null,
                dicomFilesRef: files.dicomFiles.map((f) => f.key),
                supportingDocumentsRef: files.supportingDocuments.map((f) => f.key),
            },
        }, { merge: true });

        return docRef.id;
    }
};


export const updateSubmissionPaymentStatus = async (
    firestoreDocId: string,
    status: PaymentStatus,
): Promise<void> => {
    const submissionRef = doc(db, "submissions", firestoreDocId);
    await updateDoc(submissionRef, {
        "billing.paymentStatus": status,
        updatedAt: new Date(),
    });
};

/**
 * Sets a submission's workflow `status` directly.
 *
 * @remarks
 * Used by the admin dashboard's `ChangeStatusButton`. Called directly from that client
 * component (same pattern as {@link updateSubmissionPaymentStatus} above) rather than
 * through an API route, since Firestore rules currently allow this write without auth.
 */
export const updateSubmissionStatus = async (
    firestoreDocId: string,
    status: SubmissionStatus,
): Promise<void> => {
    const submissionRef = doc(db, "submissions", firestoreDocId);
    await updateDoc(submissionRef, {
        status,
        updatedAt: new Date(),
    });
};

/**
 * Maps a Firestore error into a user-facing message.
 *
 * @remarks
 * Kept in this client-safe file (not `lib/firebaseAdmin.ts`) since it has no actual
 * dependency on firebase-admin - it's pure error-shape inspection, and the admin
 * dashboard's `error.tsx` boundary that uses it must be a Client Component (Next.js
 * requirement), which can never import firebase-admin without breaking the browser
 * bundle.
 *
 * The Admin SDK surfaces Firestore errors as numeric gRPC status codes (e.g.
 * `7` = `PERMISSION_DENIED`), NOT the string codes (`"permission-denied"`) the client
 * SDK uses - both are matched below since either could theoretically show up.
 */
export const getFirestoreErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object" && "code" in error) {
        switch (String((error as { code: unknown }).code)) {
            case "permission-denied":
            case "7":
                return "You don't have permission to view this data. Please contact the site administrator.";
            case "unavailable":
            case "14":
                return "Unable to reach the database right now. Please check your connection and try again.";
            case "not-found":
            case "5":
                return "The requested data could not be found.";
            case "cancelled":
            case "1":
                return "The request was cancelled. Please try again.";
            case "deadline-exceeded":
            case "4":
                return "The request took too long. Please try again.";
            default:
                return "Something went wrong loading data. Please try again.";
        }
    }
    return error instanceof Error ? error.message : "Something went wrong loading data. Please try again.";
};
