import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileCategory, UploadUrlRequest, UploadUrlResponse } from "@/types/upload";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const VALID_CATEGORIES = new Set<FileCategory>(["dicom", "supporting-documents", "signatures", "pdf-forms"]);

const CATEGORY_RULES: Record<FileCategory, { extensions: string[]; mimeTypes: string[] }> = {
    "dicom":                { extensions: [".dcm"],                  mimeTypes: ["application/dicom"] },
    "supporting-documents": { extensions: [".pdf"],                  mimeTypes: ["application/pdf"] },
    "signatures":           { extensions: [".png", ".jpg", ".jpeg"], mimeTypes: ["image/png", "image/jpeg"] },
    "pdf-forms":            { extensions: [".pdf"],                  mimeTypes: ["application/pdf"] },
};

function isValidForCategory(fileName: string, contentType: string, category: FileCategory): boolean {
    const rules = CATEGORY_RULES[category];
    const nameLower = fileName.toLowerCase();
    return (
        rules.extensions.some((ext) => nameLower.endsWith(ext)) ||
        rules.mimeTypes.includes(contentType)
    );
}

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
