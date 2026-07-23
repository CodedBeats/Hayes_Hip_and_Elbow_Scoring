// dependencies
import { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// types
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

/**
 * Generates a presigned S3 GET URL for downloading/viewing a file.
 *
 * @remarks
 * Expires after 30 minutes - comfortably longer than the 5-minute upload-PUT window used
 * by `app/api/upload-url/route.ts`, since this is for a human actively viewing/
 * downloading on a single case page, not a fire-and-forget upload slot.
 */
export const getFileDownloadUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key });
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

// Used by the drafts-cleanup cron job (app/api/cron/cleanup-drafts) to remove orphaned
// uploads. DeleteObjectsCommand caps out at 1000 keys per call - not chunked here since a
// single dog's file set will never come close to that.
export const deleteObjects = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return;
    await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
    }));
};

/**
 * Backfills a Firestore-derived file stub with real S3 metadata and a download URL.
 *
 * @remarks
 * Takes a stub built from just a key (key + best-effort filename only - see
 * `keyToUploadedFileStub` in `lib/firebaseAdmin.ts`) and enriches it with real S3 data.
 * Deliberately swallows failures (including {@link getFileDownloadUrl} throwing) and
 * returns the original stub unchanged - every asset-card component already renders
 * `url: undefined` as a disabled/greyed "unavailable" state, so this is a free, correct
 * degradation with no extra UI work needed for a single bad file. Callers must treat
 * `url: undefined` on the result as "unavailable," not as an error to handle separately.
 */
export const enrichUploadedFile = async (file: UploadedFile): Promise<UploadedFile> => {
    try {
        const [metadata, url] = await Promise.all([getFileMetadata(file.key), getFileDownloadUrl(file.key)]);
        if (!metadata) return file;
        return { ...file, ...metadata, url };
    } catch {
        return file;
    }
};
