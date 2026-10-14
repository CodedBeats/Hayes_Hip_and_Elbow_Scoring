import { deleteObjects } from "@/lib/s3";

type DeleteFileRequest = {
    submissionId: string;
    key: string;
};

/**
 * Deletes a single S3 object uploaded mid-submission (e.g. the user picked the wrong
 * DICOM file and wants to remove it before finishing the dog entry).
 *
 * @remarks
 * `key` must be scoped under `submissions/{submissionId}/...` - checked before calling
 * S3 so this route can't be used to delete an arbitrary object elsewhere in the bucket.
 * No auth check otherwise, matching `app/api/upload-url/route.ts`.
 */
export async function DELETE(req: Request) {
    try {
        const body: DeleteFileRequest = await req.json();
        const { submissionId, key } = body;

        if (!submissionId || !key) {
            return Response.json(
                { error: "submissionId and key are required" },
                { status: 400 },
            );
        }

        if (!key.startsWith(`submissions/${submissionId}/`)) {
            return Response.json(
                { error: "key does not belong to submissionId" },
                { status: 400 },
            );
        }

        await deleteObjects([key]);

        return Response.json({ success: true });

    } catch (error) {
        console.error("Delete file error: ", error);
        return Response.json(
            { error: "Failed to delete file" },
            { status: 500 },
        );
    }
}
