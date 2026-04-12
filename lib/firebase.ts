// firebase dependencies
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
// types




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

// create case from form input & confirmed uploaded case file
export const createCase = async (caseData: Case, uploadedFileRef: string | null) => {
    const combinedData = {
        ...caseData,
        uploadedFileRef,
    }
    const caseRef = doc(db, "cases");
    const caseDoc = await addDoc(caseRef, combinedData);
    return caseDoc;
};

// update case status (pendingReview, reviewing, completed, archived)
export const updateCaseStatus = async (newStatus: CaseStatus, caseId: string) => {
    const caseRef = doc(db, "cases", caseId);
    const caseDoc = await updateDoc(caseRef, {status: newStatus});
    return caseDoc;
};

// simple delete case, shouldn't be needed
export const deleteCase = async (caseId: string) => {
    const caseRef = doc(db, "cases", caseId);
    const caseDoc = await deleteDoc(caseRef);
    return caseDoc;
};