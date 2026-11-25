import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import { getUploadedFileCounts } from "@/lib/firebaseAdmin";
import { MAX_FILES_PER_DOG, type CappedFileCategory } from "@/lib/uploadLimits";
import type { FileCategory, UploadUrlFileRequest, UploadUrlRequest, UploadUrlResponse } from "@/types/upload";

const VALID_CATEGORIES = new Set<FileCategory>(["dicom", "supporting-documents", "pdf-forms"]);
const CAPPED_CATEGORIES = Object.keys(MAX_FILES_PER_DOG) as CappedFileCategory[];

/**
 * Allowed file extensions and MIME types per upload category.
 *
 * @remarks
 * A file is accepted if it matches EITHER an allowed extension OR an allowed MIME
 * type (see {@link isValidForCategory}) - browsers are inconsistent about setting
 * `File.type` for some formats (notably `.dcm`), so extension alone has to be enough.
 */
const CATEGORY_RULES: Record<FileCategory, { extensions: string[]; mimeTypes: string[] }> = {
    "dicom":                { extensions: [".dcm"],                              mimeTypes: ["application/dicom"] },
    "supporting-documents": { extensions: [".pdf",".jpg",".jpeg", ".png"],       mimeTypes: ["application/pdf"] },
    "pdf-forms":            { extensions: [".pdf",".jpg",".jpeg", ".png"],       mimeTypes: ["application/pdf"] },
};

function isValidForCategory(fileName: string, contentType: string, category: FileCategory): boolean {
    const rules = CATEGORY_RULES[category];
    const nameLower = fileName.toLowerCase();
    return (
        rules.extensions.some((ext) => nameLower.endsWith(ext)) ||
        rules.mimeTypes.includes(contentType)
    );
}

/**
 * Checks that this batch won't push any dog past {@link MAX_FILES_PER_DOG} in any category.
 *
 * @remarks
 * The upload boxes already stop this in the UI. This is the server-side backstop for
 * when the client's count is out of date, e.g. a second tab still showing fewer uploads.
 * Each category is checked separately, so a dog at its DICOM limit can still upload
 * supporting documents and its PDF form.
 *
 * This isn't a hard security guarantee: a URL only becomes a file once the browser PUTs
 * to it, so a client could ask for URLs several times before uploading any. Making it
 * airtight would mean tracking issued URLs server-side, which isn't worth it for a
 * per-dog cap.
 *
 * @param existingId - `undefined` means a brand-new submission, so nothing is uploaded yet.
 */
async function findFileLimitErrors(existingId: string | undefined, files: UploadUrlFileRequest[]): Promise<string[]> {
    const errors: string[] = [];
    const dogIndexes = [...new Set(files.map((f) => f.dogIndex))];

    for (const dogIndex of dogIndexes) {
        const uploaded = existingId ? await getUploadedFileCounts(existingId, dogIndex) : undefined;

        for (const category of CAPPED_CATEGORIES) {
            const requested = files.filter((f) => f.dogIndex === dogIndex && f.category === category).length;
            if (requested === 0) continue;

            const alreadyUploaded = uploaded?.[category] ?? 0;
            const max = MAX_FILES_PER_DOG[category];
            if (alreadyUploaded + requested > max) {
                errors.push(
                    `Dog ${dogIndex} can have at most ${max} ${category} files ` +
                    `(${alreadyUploaded} already uploaded, ${requested} more selected)`,
                );
            }
        }
    }

    return errors;
}

/**
 * Validates a batch of file upload requests and generates presigned S3 PUT URLs.
 *
 * @remarks
 * All files are validated up front (into an accumulated `errors` array), then checked
 * against the per-dog file limits ({@link findFileLimitErrors}), before any S3 call is
 * made, so a bad file in a batch never leaves some files half-uploaded. Each
 * accepted file gets a key shaped like
 * `submissions/{submissionId}/dog{dogIndex}/{category}/{uuid}-{fileName}` - this exact
 * format is later re-parsed by `keyToUploadedFileStub` in `lib/firebaseAdmin.ts` to
 * recover a human-readable filename, so changing the key shape here would break that
 * parsing.
 */
export async function POST(req: Request) {
    try {
        const body: UploadUrlRequest = await req.json();
        const { submissionId: existingId, files } = body;

        if (!Array.isArray(files) || files.length === 0) {
            return Response.json(
                { error: "files must be a non-empty array" },
                { status: 400 },
            );
        }

        // Validate all files before touching S3
        const errors: string[] = [];
        for (const file of files) {
            const { fileName, contentType, dogIndex, category } = file;

            if (!fileName || !contentType) {
                errors.push("Each file must have fileName and contentType");
                continue;
            }
            if (!dogIndex || dogIndex < 1) {
                errors.push(`dogIndex must be a positive integer (got ${dogIndex} for "${fileName}")`);
                continue;
            }
            if (!VALID_CATEGORIES.has(category)) {
                errors.push(`Invalid category "${category}" for file "${fileName}"`);
                continue;
            }
            if (!isValidForCategory(fileName, contentType, category)) {
                const rules = CATEGORY_RULES[category];
                errors.push(
                    `"${fileName}" is not valid for category "${category}". ` +
                    `Expected extensions: ${rules.extensions.join(", ")}`,
                );
            }
        }

        if (errors.length > 0) {
            return Response.json({ errors }, { status: 400 });
        }

        // runs after the per-file checks, since counting needs a valid dogIndex/category
        const limitErrors = await findFileLimitErrors(existingId, files);
        if (limitErrors.length > 0) {
            return Response.json({ errors: limitErrors }, { status: 400 });
        }

        const submissionId = existingId ?? crypto.randomUUID();

        const urls = await Promise.all(
            files.map(async ({ fileName, contentType, dogIndex, category }) => {
                const key = `submissions/${submissionId}/dog${dogIndex}/${category}/${crypto.randomUUID()}-${fileName}`;
                const command = new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME!,
                    Key: key,
                    ContentType: contentType,
                });
                const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
                return { uploadUrl, key, fileName };
            }),
        );

        const response: UploadUrlResponse = { submissionId, urls };
        return Response.json(response);

    } catch (error) {
        console.error("Uploading URL error: ", error);
        return Response.json(
            { error: "Failed to generate upload URL" },
            { status: 500 },
        );
    }
}
