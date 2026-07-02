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
const auth = getAuth(app);
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
            status: "submitted",
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
            status: "submitted",
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

// TODO: call from Stripe webhook handler (app/api/stripe-webhook/route.ts) after payment.intent.succeeded
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
