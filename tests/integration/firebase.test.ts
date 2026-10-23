import { describe, it, expect, afterAll } from "vitest";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, terminate, serverTimestamp, setLogLevel } from "firebase/firestore";
import { deleteApp } from "firebase/app";
import { FirebaseError } from "firebase/app";

/**
 * Live Firebase smoke test against PROD - proves the rotated service-account key and
 * client config work, that the composite indexes the crons need exist, and that the live
 * security rules (published in the console, not the gitignored local copy) actually deny
 * what they're supposed to.
 *
 * @remarks
 * Admin-side checks are read-only. The anonymous client writes below are all EXPECTED to
 * be denied; every doc ID they target starts with `vitest-`, and afterAll deletes any that
 * wrongly got through (via the Admin SDK) - the test itself will already have failed.
 */

const hasAdminEnv = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
const hasClientEnv = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const admin = await import("@/lib/firebaseAdmin");
const { markSubmissionsPaid } = await import("@/lib/payments");
const client = await import("@/lib/firebase");

const clientDb = getFirestore(client.auth.app);
// the SDK logs every denied write to stderr - those denials are the point here, so mute it
setLogLevel("silent");
const runId = `vitest-${crypto.randomUUID()}`;
const probedIds: string[] = [];

const expectDenied = async (promise: Promise<unknown>) => {
    const err = await promise.then(() => null, (e: unknown) => e);
    expect(err, "write/read was ALLOWED but the rules should deny it").toBeInstanceOf(FirebaseError);
    expect((err as FirebaseError).code).toBe("permission-denied");
};

afterAll(async () => {
    if (hasAdminEnv) {
        for (const id of probedIds) {
            const snap = await admin.getAdminDb().doc(`submissions/${id}`).get();
            if (snap.exists) {
                console.error(`[cleanup] rules let probe doc submissions/${id} through - deleting it`);
                await admin.deleteSubmissionDoc(id);
            }
        }
    }
    await terminate(clientDb);
    await deleteApp(client.auth.app);
});

describe.skipIf(!hasAdminEnv)("Firebase Admin SDK (live, read-only)", () => {
    it("the service-account key authenticates and can read submissions", async () => {
        const snap = await admin.getAdminDb().collection("submissions").limit(1).get();
        expect(Array.isArray(snap.docs)).toBe(true);
    });

    it("cleanup-drafts' composite index exists (status + updatedAt)", async () => {
        // epoch cutoff = matches nothing, but Firestore still demands the index up front
        await expect(admin.getStaleDraftSubmissions(new Date(0))).resolves.toEqual([]);
    });

    it("cleanup-abandoned's composite index exists (status + billing.paymentStatus + updatedAt)", async () => {
        await expect(admin.getStaleUnpaidSubmissions(new Date(0))).resolves.toEqual([]);
    });

    it("markSubmissionsPaid on a missing doc fails instead of creating a stub", async () => {
        const id = `${runId}-ghost_dog1`;
        probedIds.push(id);
        await expect(markSubmissionsPaid([id], "paid", "pi_vitest")).rejects.toMatchObject({ code: 5 });
        expect((await admin.getAdminDb().doc(`submissions/${id}`).get()).exists).toBe(false);
    });

    it("verifyAdminToken rejects a garbage token", async () => {
        await expect(admin.verifyAdminToken("not-a-real-token")).rejects.toThrow();
    });
});

describe.skipIf(!hasClientEnv)("Firebase client SDK + live security rules", () => {
    it("the web API key is valid (bad login is rejected as bad credentials, not a bad key)", async () => {
        const err = await client.signIn("vitest-nobody@example.invalid", "definitely-wrong").then(() => null, (e: FirebaseError) => e);
        expect(err).toBeInstanceOf(FirebaseError);
        expect(["auth/invalid-credential", "auth/user-not-found", "auth/invalid-email"]).toContain(err!.code);
    });

    it("anonymous single-doc GET is allowed (saveDraftFiles' existence check depends on it)", async () => {
        const snap = await getDoc(doc(clientDb, "submissions", `${runId}-missing_dog1`));
        expect(snap.exists()).toBe(false);
    });

    it("anonymous LIST of submissions is denied (would leak every owner's data)", async () => {
        await expectDenied(getDocs(collection(clientDb, "submissions")));
    });

    it("anonymous LIST of testSubmissions is denied", async () => {
        await expectDenied(getDocs(collection(clientDb, "testSubmissions")));
    });

    it("anonymous create claiming paymentStatus 'paid' is denied", async () => {
        const s3SubmissionId = `${runId}-paid`;
        const id = `${s3SubmissionId}_dog1`;
        probedIds.push(id);
        await expectDenied(setDoc(doc(clientDb, "submissions", id), {
            s3SubmissionId,
            dogIndex: 1,
            status: "pendingReview",
            submitterType: "owner",
            payer: "owner",
            createdAt: new Date(),
            updatedAt: serverTimestamp(),
            archived: false,
            archivedBy: "",
            billing: { billingType: "payNow", amount: 0, paymentStatus: "paid" },
            owner: { name: "vitest" },
            dog: { registeredName: "vitest" },
        }));
    });

    it("anonymous create under a doc ID that doesn't match s3SubmissionId + dogIndex is denied", async () => {
        const id = `${runId}-mismatch_dog1`;
        probedIds.push(id);
        await expectDenied(setDoc(doc(clientDb, "submissions", id), {
            s3SubmissionId: `${runId}-someone-else`,
            dogIndex: 1,
            status: "draft",
            files: { dicomFiles: [], supportingDocuments: [] },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }));
    });

    it("anonymous draft create smuggling extra fields (billing) is denied", async () => {
        const s3SubmissionId = `${runId}-smuggle`;
        const id = `${s3SubmissionId}_dog1`;
        probedIds.push(id);
        await expectDenied(setDoc(doc(clientDb, "submissions", id), {
            s3SubmissionId,
            dogIndex: 1,
            status: "draft",
            files: { dicomFiles: [], supportingDocuments: [] },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            billing: { paymentStatus: "paid" },
        }));
    });

    it("anonymous write to testSubmissions is denied", async () => {
        await expectDenied(setDoc(doc(clientDb, "testSubmissions", `${runId}-t`), { status: "draft" }));
    });

    it("anonymous delete is denied", async () => {
        await expectDenied(deleteDoc(doc(clientDb, "submissions", `${runId}-delete_dog1`)));
    });
});