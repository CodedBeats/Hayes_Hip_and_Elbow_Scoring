import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import type { FileCategory, UploadUrlRequest, UploadUrlResponse } from "@/types/upload";

const VALID_CATEGORIES = new Set<FileCategory>(["dicom", "supporting-documents", "pdf-forms"]);

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
 * Validates a batch of file upload requests and generates presigned S3 PUT URLs.
 *
 * @remarks
 * All files are validated up front (into an accumulated `errors` array) before any S3
 * call is made, so a bad file in a batch never leaves some files half-uploaded. Each
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
