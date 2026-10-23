import { describe, it, expect } from "vitest";
import { validateDogEntry } from "@/lib/validation";
import { isPhoneNumberEmpty } from "@/components/form/MobileField";
import { makeDogFormData, makeFiles, makeOwner } from "../../helpers/fixtures";

describe("validateDogEntry", () => {
    it("returns no issues for a fully completed entry", () => {
        expect(validateDogEntry(makeDogFormData(), makeOwner(), makeFiles())).toEqual([]);
    });

    it("accumulates every missing field rather than stopping at the first", () => {
        const issues = validateDogEntry(
            makeDogFormData({ registeredName: "", microchipNumber: "", breed: "", dateOfBirth: "", sex: "" as never }),
            makeOwner({ name: "", email: "" }),
            null,
        );

        expect(issues).toEqual([
            { section: "Dog Details", label: "Registered Name" },
            { section: "Dog Details", label: "Microchip Number" },
            { section: "Dog Details", label: "Breed" },
            { section: "Dog Details", label: "Date of Birth" },
            { section: "Dog Details", label: "Sex" },
            { section: "Owner Details", label: "Full Name" },
            { section: "Owner Details", label: "Email Address" },
            { section: "Uploads", label: "Completed & signed PDF submission form" },
            { section: "Uploads", label: "At least one DICOM file" },
            { section: "Uploads", label: "Dogs Australia pedigree certificate or supporting documents for non DA registered dogs" },
        ]);
    });

    it("labels the name field 'Dog Name' for non-DA-registered dogs", () => {
        const issues = validateDogEntry(makeDogFormData({ isDogsAustraliaRegistered: false, registeredName: "" }), makeOwner(), makeFiles());
        expect(issues).toEqual([{ section: "Dog Details", label: "Dog Name" }]);
    });

    it("doesn't require a phone number or registered number", () => {
        expect(validateDogEntry(makeDogFormData({ registeredNumber: "" }), makeOwner({ phone: "" }), makeFiles())).toEqual([]);
    });

    it("flags each upload category independently", () => {
        expect(validateDogEntry(makeDogFormData(), makeOwner(), makeFiles({ pdfForm: undefined }))).toEqual([
            { section: "Uploads", label: "Completed & signed PDF submission form" },
        ]);
        expect(validateDogEntry(makeDogFormData(), makeOwner(), makeFiles({ dicomFiles: [] }))).toEqual([
            { section: "Uploads", label: "At least one DICOM file" },
        ]);
        expect(validateDogEntry(makeDogFormData(), makeOwner(), makeFiles({ supportingDocuments: [] }))).toEqual([
            { section: "Uploads", label: "Dogs Australia pedigree certificate or supporting documents for non DA registered dogs" },
        ]);
    });
});

describe("isPhoneNumberEmpty", () => {
    it.each([
        ["", true],
        ["+61", true],
        ["+61 ", true],
        ["+61    ", true],
        ["+61 400000000", false],
        // no country code picked, number typed - the composite is " 400..."
        [" 400000000", false],
    ])("%j -> %s", (value, expected) => {
        expect(isPhoneNumberEmpty(value)).toBe(expected);
    });
});