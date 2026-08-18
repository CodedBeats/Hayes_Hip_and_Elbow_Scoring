// components
import { isPhoneNumberEmpty } from "@/components/form/MobileField";
// types
import type { DogEntryFormData } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { Files } from "@/types/submission";
import type { ValidationIssue } from "@/types/validation";

/**
 * Validates a dog entry's required fields/uploads, accumulating every missing field
 * rather than bailing on the first one, so `ValidationSummary` can show the user
 * everything wrong at once.
 *
 * @remarks
 * A supporting document is only required when the dog is NOT Dogs Australia
 * registered (registered dogs don't need one).
 */
export const validateDogEntry = (
    dogData: DogEntryFormData,
    ownerData: OwnerDetails,
    uploadedFiles: Files | null,
): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // dog
    if (!dogData.registeredName) issues.push({ section: "Dog Details", label: dogData.isDogsAustraliaRegistered ? "Registered Name" : "Dog Name" });
    if (!dogData.microchipNumber) issues.push({ section: "Dog Details", label: "Microchip Number" });
    if (!dogData.breed) issues.push({ section: "Dog Details", label: "Breed" });
    if (!dogData.dateOfBirth) issues.push({ section: "Dog Details", label: "Date of Birth" });
    if (!dogData.sex) issues.push({ section: "Dog Details", label: "Sex" });

    // owner
    if (!ownerData.name) issues.push({ section: "Owner Details", label: "Full Name" });
    if (!ownerData.email) issues.push({ section: "Owner Details", label: "Email Address" });
    // if (isPhoneNumberEmpty(ownerData.phone)) issues.push({ section: "Owner Details", label: "Phone Number" });

    // uploads
    if (!uploadedFiles?.pdfForm) issues.push({ section: "Uploads", label: "Completed & signed PDF submission form" });
    if (!uploadedFiles || uploadedFiles.dicomFiles.length === 0) issues.push({ section: "Uploads", label: "At least one DICOM file" });
    if (!dogData.isDogsAustraliaRegistered && (uploadedFiles?.supportingDocuments.length ?? 0) === 0) {
        issues.push({ section: "Uploads", label: "Registration certificate or supporting document (dog not Dogs Australia registered)" });
    }

    return issues;
};
