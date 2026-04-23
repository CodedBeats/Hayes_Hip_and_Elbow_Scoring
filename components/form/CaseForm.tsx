// dependencies
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// components
import { InputField } from "./InputField";
import { FileUploader } from "../upload/FileUploader";
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
    
        // veterinarian details
        referringVeterinarianName: "",
        referringVeerinarianPractice: "",
        veterinarianAddress: "",
        veterinarianPhone: "",
        positiveOdentificationSighted: false,
        certificateOfRegistrationAndPedigreeSighted: false,
        dateOfRadiograph: "",
    });
    const [isLoading, setIsLoading] = useState(false);


    

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
                memberNumber: formData.memberNumber,
            
                // veterinarian details
                referringVeterinarianName: formData.referringVeterinarianName,
                referringVeerinarianPractice: formData.referringVeerinarianPractice,
                veterinarianAddress: formData.veterinarianAddress,
                veterinarianPhone: formData.veterinarianPhone,
                positiveOdentificationSighted: formData.positiveOdentificationSighted,
                certificateOfRegistrationAndPedigreeSighted: formData.certificateOfRegistrationAndPedigreeSighted,
                dateOfRadiograph: formData.dateOfRadiograph,
                veterinarianSignatureRef: "xyzzzzzzzzzzz", // ref to .png/.jpg file uploaded on s3
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



    return (
        <form
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-10 w-full max-w-3xl mx-auto px-6 py-16"
        >
            {/* ======================= */}
            {/* DOG DETAILS */}
            {/* ======================= */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Dog Details</h2>

                <InputField
                    label="Dogs Australia Registered"
                    name="isDogsAustraliaRegistered"
                    type="checkbox"
                    value={formData.isDogsAustraliaRegistered}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            isDogsAustraliaRegistered: e.target.checked,
                        })
                    }
                />

                <InputField
                    label="Registered Name"
                    name="registeredName"
                    type="text"
                    placeholder="e.g. Champion Rover"
                    value={formData.registeredName}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            registeredName: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Registered Number"
                    name="registeredNumber"
                    type="text"
                    placeholder="e.g. 2100123456"
                    value={formData.registeredNumber}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            registeredNumber: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Microchip Number"
                    name="microchipNumber"
                    type="text"
                    placeholder="e.g. 953010004567890"
                    value={formData.microchipNumber}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            microchipNumber: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Breed"
                    name="breed"
                    type="text"
                    placeholder="e.g. Labrador Retriever"
                    value={formData.breed}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            breed: e.target.value,
                        })
                    }
                />
            </section>

            {/* ======================= */}
            {/* OWNER DETAILS */}
            {/* ======================= */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Owner Details</h2>

                <InputField
                    label="Owner Name"
                    name="ownerName"
                    type="text"
                    placeholder="e.g. John Smith"
                    value={formData.ownerName}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            ownerName: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Owner Email"
                    name="ownerEmail"
                    type="email"
                    placeholder="john@email.com"
                    value={formData.ownerEmail}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            ownerEmail: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Owner Address"
                    name="ownerAddress"
                    type="text"
                    placeholder="123 Main Street"
                    value={formData.ownerAddress}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            ownerAddress: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Member Number"
                    name="memberNumber"
                    type="text"
                    placeholder="Optional"
                    value={formData.memberNumber}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            memberNumber: e.target.value,
                        })
                    }
                />
            </section>

            {/* ======================= */}
            {/* VETERINARIAN DETAILS */}
            {/* ======================= */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Veterinarian Details</h2>

                <InputField
                    label="Veterinarian Name"
                    name="referringVeterinarianName"
                    type="text"
                    placeholder="Dr Jane Smith"
                    value={formData.referringVeterinarianName}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            referringVeterinarianName: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Practice Name"
                    name="referringVeerinarianPractice"
                    type="text"
                    placeholder="Animal Care Clinic"
                    value={formData.referringVeerinarianPractice}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            referringVeerinarianPractice: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Veterinarian Address"
                    name="veterinarianAddress"
                    type="text"
                    placeholder="45 Clinic Road"
                    value={formData.veterinarianAddress}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            veterinarianAddress: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Veterinarian Phone"
                    name="veterinarianPhone"
                    type="tel"
                    placeholder="0400 000 000"
                    value={formData.veterinarianPhone}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            veterinarianPhone: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Date Of Radiograph"
                    name="dateOfRadiograph"
                    type="date"
                    value={formData.dateOfRadiograph}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            dateOfRadiograph: e.target.value,
                        })
                    }
                />

                <InputField
                    label="Positive Identification Sighted"
                    name="positiveOdentificationSighted"
                    type="checkbox"
                    value={formData.positiveOdentificationSighted}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            positiveOdentificationSighted: e.target.checked,
                        })
                    }
                />

                <InputField
                    label="Certificate Of Registration & Pedigree Sighted"
                    name="certificateOfRegistrationAndPedigreeSighted"
                    type="checkbox"
                    value={formData.certificateOfRegistrationAndPedigreeSighted}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            certificateOfRegistrationAndPedigreeSighted:
                                e.target.checked,
                        })
                    }
                />
            </section>

            {/* ======================= */}
            {/* FILE UPLOAD */}
            {/* ======================= */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Upload Files</h2>

                <FileUploader />
            </section>

            {/* ======================= */}
            {/* SUBMIT */}
            {/* ======================= */}
            <button
                type="submit"
                disabled={isLoading}
                className="bg-black text-white px-6 py-3 rounded-md disabled:opacity-50"
            >
                {isLoading ? "Submitting..." : "Submit Case"}
            </button>
        </form>
    );
}   
