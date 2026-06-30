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
// get single case data
export const getCase = async (caseId: string) => {
    const caseRef = doc(db, "cases", caseId);
    const caseDoc = await getDoc(caseRef);
    return caseDoc;
};

// get all cases data
export const getCases = async () => {
    const caseRef = collection(db, "cases");
    const caseDocs = await getDocs(caseRef);
    return caseDocs;
};

// get signature file from storage
export const getSignatureFile = async (signatureImgName: string) => {
    const signatureRef = ref(storage, `signatures/${signatureImgName}`);
    const signatureFile = await getDownloadURL(signatureRef);
    return signatureFile;
};

// === CREATE === //
// create case from form input & confirmed uploaded DICOM case file
export const createCase = async (
    caseData: Submission,
    uploadedDICOMFileRef: string | null,
) => {
    const combinedData = {
        ...caseData,
        uploadedDICOMFileRef,
    };
    const caseRef = collection(db, "cases");
    const caseDoc = await addDoc(caseRef, combinedData);
    return caseDoc;
};

// add signature img to storage
export const uploadSignatureImg = async (
    signatureImgName: string,
    signatureFolderName: string,
    signatureFile: File,
) => {
    // create ref for the cloud storage bucket
    const signatureRef = ref(
        storage,
        `signatures/${signatureFolderName}/${signatureImgName}`,
    );
    const signatureUpload = await uploadBytes(signatureRef, signatureFile);
    return signatureUpload;
};

// === UPLOAD === //
// update case status (pendingReview, reviewing, completed, archived)
export const updateCaseStatus = async (
    newStatus: SubmissionStatus,
    caseId: string,
) => {
    const caseRef = doc(db, "cases", caseId);
    const caseDoc = await updateDoc(caseRef, { status: newStatus });
    return caseDoc;
};

// === DELETE === //
// simple delete case, shouldn't be needed due to archiving
export const deleteCase = async (caseId: string) => {
    const caseRef = doc(db, "cases", caseId);
    const caseDoc = await deleteDoc(caseRef);
    return caseDoc;
};


// ===================== //
// === SUBMISSIONS ==== //
// ===================== //

type CreateSubmissionPayload = {
    s3SubmissionId: string;
    dogIndex: number;
    owner: OwnerDetails;
    veterinarian: VeterinarianDetails;
    dog: DogCase;
    files: Files;
    billing: BillingInfo;
};

// Creates one Firestore submission document per dog.
// billing.paymentStatus always starts as "unpaid" — updated by Stripe webhook on successful payment.
export const createSubmission = async (payload: CreateSubmissionPayload): Promise<string> => {
    const { s3SubmissionId, dogIndex, owner, veterinarian, dog, files, billing } = payload;

    const docRef = await addDoc(collection(db, "submissions"), {
        s3SubmissionId,
        dogIndex,
        status: "submitted",
        submitterType: "owner",
        submissionType: "online",
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
            dicomFilesRef: files.dicomFiles.map((f) => f.key),
            supportingDocumentsRef: files.supportingDocuments.map((f) => f.key),
        },
    });

    return docRef.id;
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
