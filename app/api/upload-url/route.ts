import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// aws s3 config
const s3 = new S3Client({ 
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});


// post request
export async function POST(req: Request) {
    // console.log("hit route");
    try {
        // get file name and content type from request body
        const { fileName, contentType } = await req.json();

    
        // === Validate === //
        // validate file name and exists
        if (!fileName || !contentType) {
            return Response.json(
                { error: "Missing fileName or contentType" },
                { status: 400 }, // bad request
            );
        }
        // validate DICOM file
        const isDicom = fileName.toLowerCase().endsWith(".dcm") || contentType === "application/dicom";
        if (!isDicom) {
            return NextResponse.json(
                { error: "File must be a DICOM file (.dcm)" },
                { status: 400 },
            );
        }



        // === Upload === //
        // generate random key for file
        const key = `cases/${crypto.randomUUID()}-${fileName}`;
    
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
            ContentType: contentType,
        });

        // generate signed url (expires in 5 mins)
        const uploadUrl = await getSignedUrl(s3, command, {
            expiresIn: 60 * 5, // 5 min
        });
        // return signed url and key
        return Response.json({ uploadUrl, key });

        
    } catch (error) {
        console.error("Uploading URL error: ", error);

        return Response.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }, // internal Server Error
        );
    }
}
