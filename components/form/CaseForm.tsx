// dependencies
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// components
import { InputField } from "./InputField";
import { MobileField } from "./MobileField";
import { FileUploader } from "../upload/FileUploader";
import { ImageUploader } from "../upload/ImageUploader";
// type
import { Case } from "@/types/case";


export const CaseForm = () => {
    // routing
    const router = useRouter();
    // state
    const [formData, setFormData] = useState({
        // dog details
        isDogsAustraliaRegistered: false,
        registeredName: "",
        registeredNumber: "",
        microchipNumber: "",
        breed: "",
    
        // owner details
        ownerName: "",
        ownerEmail: "",
        ownerAddress: "",
        memberNumber: "",
        // owner declaration
        ownerTelephoneNumber: "",
    
        // veterinarian details
        referringVeterinarianName: "",
        referringVeterinarianPractice: "",
        veterinarianAddress: "",
        veterinarianPhone: "",
        positiveOdentificationSighted: false,
        certificateOfRegistrationAndPedigreeSighted: false,
        dateOfRadiograph: "",
    });
    const [isLoading, setIsLoading] = useState(false);


    

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
        setIsLoading(true);

        try {
            // === upload .dcm file(s) in s3 ===
            // use date as file name


            // === upload signature in s3 ===
            // use date as file name


            // === create case in firestore ===
            // get date
            const date = Date.now();
            // create new case data
            const newCase: Case = {
                // yes I know I can x = { ...formData } but I'm doing this for clarity during dev
                
                // case details
                status: "pendingReview",
                createdAt: new Date(date),
                uploadedDICOMFileRef: "xyzzzzzzzzzzz", // ref to .dcm file uploaded on s3
            
                // dog details
                isDogsAustraliaRegistered: formData.isDogsAustraliaRegistered,
                registeredName: formData.registeredName,
                registeredNumber: formData.registeredNumber,
                microchipNumber: formData.microchipNumber,
                breed: formData.breed,
            
                // owner details
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                ownerAddress: formData.ownerAddress,
                ownerTelephoneNumber: formData.ownerTelephoneNumber,
                memberNumber: formData.memberNumber,
                ownerSignatureRef: "xyzzzzzzzzzzz", // ref to .png/.jpg file uploaded in firebase storage
            
                // veterinarian details
                referringVeterinarianName: formData.referringVeterinarianName,
                referringVeterinarianPractice: formData.referringVeterinarianPractice,
                veterinarianAddress: formData.veterinarianAddress,
                veterinarianPhone: formData.veterinarianPhone,
                positiveOdentificationSighted: formData.positiveOdentificationSighted,
                certificateOfRegistrationAndPedigreeSighted: formData.certificateOfRegistrationAndPedigreeSighted,
                dateOfRadiograph: formData.dateOfRadiograph,
                veterinarianSignatureRef: "xyzzzzzzzzzzz", // ref to .png/.jpg file uploaded in firebase storage
            }
            // create document in firestore


            // push to success page after all went well
            setIsLoading(false);
            // router.push("/success");


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
        { name: 'positiveOdentificationSighted', label: 'Positive Odentification Sighted', type: 'checkbox' },
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
            <ImageUploader />


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


            {/* ======================= */}
            {/* FILE UPLOAD */}
            {/* ======================= */}
            <section className="space-y-4 mt-10">
                <h2 className="text-3xl font-semibold">Upload DICOM Files</h2>

                <FileUploader />
            </section>

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit'}
            </button>
        </form>
    );
};

