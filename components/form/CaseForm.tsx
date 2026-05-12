// dependencies
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// === components ===
// field
import { InputField } from "./InputField";
import { MobileField } from "./MobileField";
// img and file uploader
import { FileUploader } from "../upload/FileUploader";
import { ImageUploader } from "../upload/ImageUploader";
// btns
import { StripeCheckoutButton } from "../buttons/StripeCheckoutBtn"
import { TestLogBtn } from "../buttons/TestLogBtn";
// util
import { generateCurrentTime } from "@/util/dateTime";
import { isNonEmptyString } from "@/util/stringManipulation";
// type
import { Case } from "@/types/case";


export const CaseForm = () => {
    // routing
    const router = useRouter();
    // state
    // const [formData, setFormData] = useState({
    //     // dog details
    //     isDogsAustraliaRegistered: false,
    //     registeredName: "",
    //     registeredNumber: "",
    //     microchipNumber: "",
    //     breed: "",
    
    //     // owner details
    //     ownerName: "",
    //     ownerEmail: "",
    //     ownerAddress: "",
    //     memberNumber: "",
    //     // owner declaration
    //     ownerTelephoneNumber: "",
    
    //     // veterinarian details
    //     referringVeterinarianName: "",
    //     referringVeterinarianPractice: "",
    //     veterinarianAddress: "",
    //     veterinarianPhone: "",
    //     positiveIdentificationSighted: false,
    //     certificateOfRegistrationAndPedigreeSighted: false,
    //     dateOfRadiograph: "",
    // });
    // temp data
    const [formData, setFormData] = useState({
        // dog details
        isDogsAustraliaRegistered: true,
        registeredName: "Dog Man",
        registeredNumber: "333registeredNumber",
        microchipNumber: "333microchipNumber",
        breed: "333breed",
    
        // owner details
        ownerName: "444ownerName",
        ownerEmail: "444email@me.com",
        ownerAddress: "444ownerAddress",
        memberNumber: "444memberNumber",
        // owner declaration
        ownerTelephoneNumber: "0909 999 999",
    
        // veterinarian details
        referringVeterinarianName: "555referringVeterinarianName",
        referringVeterinarianPractice: "555referringVeterinarianPractice",
        veterinarianAddress: "555veterinarianAddress",
        veterinarianPhone: "0808 888 888",
        positiveIdentificationSighted: true,
        certificateOfRegistrationAndPedigreeSighted: true,
        dateOfRadiograph: "1st of The Month",
    });
    const [uploadRefs, setUploadRefs] = useState({
        dicomKey: "",
        ownerSignatureKey: "",
        vetSignatureKey: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formFilesUploaded, setFormFilesUploaded] = useState(false);
    // store name for signature folder name with initial state
    const [initialTimeFolderName, setInitialTimeFolderName] = useState(generateCurrentTime)

    

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
        console.log(uploadRefs);
        setIsLoading(true);

        try {
            // validate
            if (
                !uploadRefs.dicomKey ||
                !uploadRefs.ownerSignatureKey ||
                !uploadRefs.vetSignatureKey
            ) {
                alert("Please upload all required files.");
                return;
            }

            // store formData in loacl storage
            localStorage.setItem(
                "caseFormData",
                JSON.stringify(formData)
            );
            // store dicom and signature refs in local storage
            localStorage.setItem(
                "uploadRefs",
                JSON.stringify(uploadRefs)
            );

            // can now proceed to payment
            setIsLoading(false);
            setFormFilesUploaded(true)

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        } 
    }

    const dogDetailsFields = [
        { name: 'isDogsAustraliaRegistered', label: 'Is Dog Registered with Dogs Australia?', type: 'checkbox' },
        { name: 'registeredName', label: 'Registered Name', type: 'text' },
        { name: 'registeredNumber', label: 'Registered Number', type: 'text' },
        { name: 'microchipNumber', label: 'Microchip Number', type: 'text' },
        { name: 'breed', label: 'Breed', type: 'text' },
    ];
    const ownerDetailsFields = [
        { name: 'ownerName', label: 'Owner Name', type: 'text' },
        { name: 'ownerEmail', label: 'Owner Email', type: 'email' },
        { name: 'ownerAddress', label: 'Owner Address', type: 'text' },
        { name: 'memberNumber', label: 'Member Number', type: 'text' },
        { name: 'ownerTelephoneNumber', label: 'Owner Telephone Number', type: 'text' },
    ];
    const veterinarianDetailsFields = [
        { name: 'referringVeterinarianName', label: 'Referring Veterinarian Name', type: 'text' },
        { name: 'referringVeterinarianPractice', label: 'Referring Veterinarian Practice', type: 'text' },
        { name: 'veterinarianAddress', label: 'Veterinarian Address', type: 'text' },
        { name: 'veterinarianPhone', label: 'Veterinarian Phone', type: 'text' },
        { name: 'positiveIdentificationSighted', label: 'Positive Identification Sighted', type: 'checkbox' },
        { name: 'certificateOfRegistrationAndPedigreeSighted', label: 'Certificate of Registration and Pedigree Sighted', type: 'checkbox' },
        { name: 'dateOfRadiograph', label: 'Date of Radiograph', type: 'date' },
    ];

    return (
        <form onSubmit={handleFormSubmit}>
            {/* ======================= */}
            {/* DOG DETAILS */}
            {/* ======================= */}
            <h1 className="text-3xl mt-10">Dog Details</h1>
            {dogDetailsFields.map((field) => (
                <InputField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
            ))}


            {/* ======================= */}
            {/* Owner */}
            {/* ======================= */}
            <h2 className="text-3xl mt-10">Owner Details</h2>
            {ownerDetailsFields.map((field) => 
                field.name === "ownerTelephoneNumber" ? (
                    <MobileField
                        key={field.name}
                        value={formData[field.name as keyof typeof formData] as string}
                        onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                    />
                ) : (
                    <InputField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                )
            )}
            <h2 className="text-2xl font-semibold">Owner Declaration</h2>
            <p className="text-amber-300">Owner signature upload here</p>
            {/* === owner's signature === */}
            <ImageUploader
                folderName={`owner-signatures/${initialTimeFolderName}`}
                onUploaded={(image) =>
                    setUploadRefs((prev) => ({
                        ...prev,
                        ownerSignatureKey: image.key,
                    }))
                }
            />


            {/* ======================= */}
            {/* Veterinarian DETAILS */}
            {/* ======================= */}
            <h2 className="text-3xl mt-10">Veterinarian Details</h2>
            {veterinarianDetailsFields.map((field) => 
                field.name === "veterinarianPhone" ? (
                    <MobileField
                        key={field.name}
                        value={formData[field.name]}
                        onChange={(value) => setFormData({ ...formData, [field.name]: value})}
                    />
                ) : (
                    <InputField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                )
            )}
            {/* === veterinarian's signature === */}
            <p className="text-amber-300">Veterinarian signature upload here</p>
            <ImageUploader
                folderName={`vet-signatures/${initialTimeFolderName}`}
                onUploaded={(image) =>
                    setUploadRefs((prev) => ({
                        ...prev,
                        vetSignatureKey: image.key,
                    }))
                }
            />


            {/* ======================= */}
            {/* FILE UPLOAD */}
            {/* ======================= */}
            <h2 className="text-3xl font-semibold mt-10">Upload DICOM Files</h2>
            <FileUploader
                onUploaded={(file) =>
                    setUploadRefs((prev) => ({
                        ...prev,
                        dicomKey: file.key,
                    }))
                }
            />

            <div className="flex flex-col mt-10">
                <StripeCheckoutButton
                    disabled={
                        !isNonEmptyString(uploadRefs.dicomKey) ||
                        !isNonEmptyString(uploadRefs.ownerSignatureKey) ||
                        !isNonEmptyString(uploadRefs.vetSignatureKey)
                    }
                    text={
                        isNonEmptyString(uploadRefs.dicomKey) &&
                        isNonEmptyString(uploadRefs.ownerSignatureKey) &&
                        isNonEmptyString(uploadRefs.vetSignatureKey)
                        ? 
                        "Process to Checkout" 
                        : 
                        "Please Fill All Fields & Upload Files"
                    }
                />
            </div>
            <div>
                <TestLogBtn data={uploadRefs} />
            </div>
        </form>
    );
};

