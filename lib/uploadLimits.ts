/**
 * Most files one dog can have uploaded in each multi-file upload category.
 *
 * @remarks
 * Shared by the upload boxes in `DogEntryOnlineForm` (so the user is stopped before
 * uploading) and `app/api/upload-url/route.ts` (the server-side check, which a stale
 * second tab or a modified client can't skip). It lives in its own file because the
 * client needs it, and `lib/s3.ts` / `lib/firebaseAdmin.ts` must never be pulled into
 * the browser bundle.
 *
 * Only 3 images are actually needed (pelvis + each elbow), so 10 is deliberately
 * generous. `pdf-forms` isn't listed because it's a single file that gets replaced, not
 * added to.
 */
export const MAX_FILES_PER_DOG = {
    "dicom": 10,
    "supporting-documents": 10,
} as const;

export type CappedFileCategory = keyof typeof MAX_FILES_PER_DOG;
