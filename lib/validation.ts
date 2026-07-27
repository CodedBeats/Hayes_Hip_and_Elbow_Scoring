// components
import { isPhoneNumberEmpty } from "@/components/form/MobileField";
// types
import type { DogEntryFormData } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";
import type { Files } from "@/types/submission";
import type { ValidationIssue } from "@/types/validation";

/**
 * Validates a dog entry's required fields/uploads for the given submission mode,
 * accumulating every missing field rather than bailing on the first one, so
 * `ValidationSummary` can show the user everything wrong at once.
 *
 * @remarks
 * The two submission modes require entirely different sets of fields, so this
 * branches on `submissionType` rather than sharing one rule set:
 * - **pdf mode**: only requires the uploaded PDF form and at least one DICOM file.
 *   A supporting document is only required when the dog is NOT Dogs Australia
 *   registered (registered dogs don't need one).
 *   Everything else (owner/vet/dog structured fields) is skipped entirely, since
 *   that data lives inside the PDF itself, not in this form - see
 *   {@link mapSubmissionDoc | mapSubmissionDoc's pdf-mode placeholder handling} in
 *   `lib/firebaseAdmin.ts` for the other side of this.
 * - **online mode**: requires the full structured dog/owner/vet fields plus a DICOM
 *   file and both signatures.
 */
export const validateDogEntry = (
    submissionType: "online" | "pdf",
    dogData: DogEntryFormData,
    ownerData: OwnerDetails,
    vetData: VeterinarianDetails,
    uploadedFiles: Files | null,
): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (submissionType === "pdf") {
        if (!uploadedFiles?.pdfForm) {
            issues.push({ section: "PDF Submission", label: "Completed PDF submission form" });
        }
        if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) {
            issues.push({ section: "DICOM & Supporting Files", label: "At least one DICOM file" });
        }
        // supporting document only required when Not DA Registered
        if (!dogData.isDogsAustraliaRegistered && (uploadedFiles?.supportingDocuments.length ?? 0) === 0) {
            issues.push({ section: "DICOM & Supporting Files", label: "Registration certificate or supporting document (dog not Dogs Australia registered)" });
        }
    } else {
        // dog
        if (!dogData.registeredName) issues.push({ section: "Dog Details", label: dogData.isDogsAustraliaRegistered ? "Registered Name" : "Dog Name" });
        if (!dogData.microchipNumber) issues.push({ section: "Dog Details", label: "Microchip Number" });
        if (!dogData.breed) issues.push({ section: "Dog Details", label: "Breed" });
        if (!dogData.dateOfBirth) issues.push({ section: "Dog Details", label: "Date of Birth" });
        if (!dogData.sex) issues.push({ section: "Dog Details", label: "Sex" });

        // owner
        if (!ownerData.name) issues.push({ section: "Owner Details", label: "Full Name" });
        if (!ownerData.email) issues.push({ section: "Owner Details", label: "Email Address" });
        if (isPhoneNumberEmpty(ownerData.phone)) issues.push({ section: "Owner Details", label: "Phone Number" });

        // vet - dateOfRadiograph lives on dogData but is grouped here since it's
        // displayed in the Veterinarian Details card
        if (!vetData.veterinarianName) issues.push({ section: "Veterinarian Details", label: "Veterinarian Name" });
        if (!vetData.practiceName) issues.push({ section: "Veterinarian Details", label: "Clinic / Practice Name" });
        if (isPhoneNumberEmpty(vetData.phone)) issues.push({ section: "Veterinarian Details", label: "Practice Phone" });
        if (!dogData.dateOfRadiograph) issues.push({ section: "Veterinarian Details", label: "Date of Radiograph" });

        // dicom + signatures
        if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) issues.push({ section: "DICOM & Supporting Files", label: "At least one DICOM file" });
        if (!uploadedFiles?.ownerSignature) issues.push({ section: "DICOM & Supporting Files", label: "Owner Signature" });
        if (!uploadedFiles?.veterinarianSignature) issues.push({ section: "DICOM & Supporting Files", label: "Veterinarian Signature" });
    }

    return issues;
};
