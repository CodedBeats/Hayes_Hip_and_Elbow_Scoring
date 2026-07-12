// firebase dependencies
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
const storage = getStorage(app);

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

// probably don't need
// export const createUser = async (email: string, password: string) => {
//     const user = await createUserWithEmailAndPassword(auth, email, password);
//     return user;
// };

// ================= //
// === FIRESTORE === //
// ================= //

// === READ === //
// get single dog entry data


// get single submission entry data


// get all dog entry data


// get all submission entry data



// === UPLOAD === //
// update submission status ("draft", "submitted", "pendingReview", "reviewing", "completed", "archived")


// === DELETE === //
// simple delete dog entry, shouldn't be needed due to archiving

// simple delete submission, shouldn't be needed due to archiving



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

// creates one firestore submission document per dog (though many many have same s3SubmissionId)
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

    // handle difference between online and pdf submission types
    if (submissionType === "pdf") {
        // create submission with just files
        const docRef = await addDoc(collection(db, "submissions"), {
            s3SubmissionId,
            dogIndex,
            status: "pendingReview",
            submitterType: "anon",
            submissionType,
            createdAt: new Date(),
            billing,
            pdfFormRef: files.pdfForm?.key ?? null,
            // owner and vet fields just become refs to signatures
            owner: files.ownerSignature?.key ?? null,
            veterinarian: files.veterinarianSignature?.key ?? null,
            dog: {
                dicomFilesRef: files.dicomFiles.map((f) => f.key),
                supportingDocumentsRef: files.supportingDocuments.map((f) => f.key),
            },
        });

        return docRef.id;

    } else {
        // create submission with all form fields and files
        const docRef = await addDoc(collection(db, "submissions"), {
            s3SubmissionId,
            dogIndex,
            status: "pendingReview",
            submitterType: "anon",
            submissionType,
            createdAt: new Date(),
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
        });

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

// Used by the admin dashboard's ChangeStatusButton. Called directly from that client
// component (same pattern as updateSubmissionPaymentStatus above, e.g. from
// app/(main)/success/page.tsx) rather than through an API route, since Firestore rules
// currently allow this write without auth.
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

// Mirrors getAuthErrorMessage's style above. Kept in this client-safe file (not
// lib/firebaseAdmin.ts) since it has no actual dependency on firebase-admin - it's pure
// error-shape inspection, and the admin dashboard's error.tsx boundary that uses it must
// be a Client Component (Next.js requirement), which can never import firebase-admin
// without breaking the browser bundle.
//
// Note the Admin SDK surfaces Firestore errors as numeric gRPC status codes (e.g.
// 7 = PERMISSION_DENIED), NOT the string codes ("permission-denied") the client SDK
// uses - both are matched below since either could theoretically show up.
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
