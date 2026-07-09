import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadedFile } from "@/types/upload";

// Shared client so upload (PUT) and download (GET) presigning use one consistent
// config instead of two independently-configured clients drifting apart over time.
export const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const getFileDownloadUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key });
    // 30 minutes - comfortably longer than the 5-minute upload-PUT window, since this is
    // for a human actively viewing/downloading on a single case page, not a fire-and-
    // forget upload slot.
    return getSignedUrl(s3, command, { expiresIn: 60 * 30 });
};

export const getFileMetadata = async (
    key: string,
): Promise<{ size: number; contentType: string; uploadedAt: Date } | null> => {
    try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key }));
        return {
            size: head.ContentLength ?? 0,
            contentType: head.ContentType ?? "application/octet-stream",
            uploadedAt: head.LastModified ?? new Date(0),
        };
    } catch {
        // e.g. the object was deleted from S3 but the Firestore ref still points at it,
        // or a transient network error - degrade gracefully rather than throw, since one
        // missing/broken file should never take down the whole case page.
        return null;
    }
};

// Takes a Firestore-derived stub (key + best-effort filename only, see
// lib/firebaseAdmin.ts's keyToUploadedFileStub) and backfills it with real S3 data.
// Deliberately swallows failures (including getFileDownloadUrl throwing) and returns the
// original stub unchanged - every asset-card component already renders `url: undefined`
// as a disabled/greyed "unavailable" state, so this is a free, correct degradation with
// no extra UI work needed for a single bad file.
export const enrichUploadedFile = async (file: UploadedFile): Promise<UploadedFile> => {
    try {
        const [metadata, url] = await Promise.all([getFileMetadata(file.key), getFileDownloadUrl(file.key)]);
        if (!metadata) return file;
        return { ...file, ...metadata, url };
    } catch {
        return file;
    }
};
