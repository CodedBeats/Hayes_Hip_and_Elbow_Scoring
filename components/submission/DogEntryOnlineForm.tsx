"use client";
import { InputField } from "../form/InputField";
import { MobileField } from "../form/MobileField";
import type { DogEntryFormData } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { VeterinarianDetails } from "@/types/vet";

type Props = {
    isDogsAustraliaRegistered: boolean;
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    vetData: VeterinarianDetails;
    setDog: (field: keyof DogEntryFormData, value: string | boolean) => void;
    setOwner: (field: keyof OwnerDetails, value: string) => void;
    setVet: (field: keyof VeterinarianDetails, value: string | boolean) => void;
    selectedDicom: File[];
    selectedDocs: File[];
    ownerSigFile: File | null;
    vetSigFile: File | null;
    onDicomChange: (files: File[]) => void;
    onDocsChange: (files: File[]) => void;
    onOwnerSigChange: (file: File | null) => void;
    onVetSigChange: (file: File | null) => void;
    resetKey: number;
};

export const DogEntryOnlineForm = ({
    isDogsAustraliaRegistered,
    dogData, ownerData, vetData,
    setDog, setOwner, setVet,
    selectedDicom, selectedDocs, ownerSigFile, vetSigFile,
    onDicomChange, onDocsChange, onOwnerSigChange, onVetSigChange,
    resetKey,
}: Props) => {
    return (
        <>
            {/* -- Dog Details -- */}
            <h4 className="mt-6 text-lg font-semibold text-gray-800">Dog Details</h4>
            <InputField
                name="registeredName"
                label={isDogsAustraliaRegistered ? "Registered Name *" : "Dog Name *"}
                type="text"
                value={dogData.registeredName}
                onChange={(e) => setDog("registeredName", e.target.value)}
            />
            {isDogsAustraliaRegistered && (
                <InputField
                    name="registeredNumber"
                    label="Registered Number"
                    type="text"
                    value={dogData.registeredNumber}
                    onChange={(e) => setDog("registeredNumber", e.target.value)}
                />
            )}
            <InputField 
                name="microchipNumber" label="Microchip Number *" type="text"
                value={dogData.microchipNumber} onChange={(e) => setDog("microchipNumber", e.target.value)} 
            />
            <InputField 
                name="breed" label="Breed *" type="text"
                value={dogData.breed} onChange={(e) => setDog("breed", e.target.value)} 
            />
            <div className="mb-4 w-full">
                <label className="block mb-2 text-sm font-medium">Sex *</label>
                <select
                    value={dogData.sex}
                    onChange={(e) => setDog("sex", e.target.value as "male" | "female")}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <InputField 
                name="dateOfBirth" label="Date of Birth *" type="date"
                value={dogData.dateOfBirth} onChange={(e) => setDog("dateOfBirth", e.target.value)} 
            />
            <InputField 
                name="dateOfRadiograph" label="Date of Radiograph *" type="date"
                value={dogData.dateOfRadiograph} onChange={(e) => setDog("dateOfRadiograph", e.target.value)} 
            />

            {/* -- Owner Details -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Owner Details</h4>
            <InputField 
                name="ownerName" label="Name *" type="text"
                value={ownerData.name} onChange={(e) => setOwner("name", e.target.value)} 
            />
            <InputField 
                name="ownerEmail" label="Email *" type="email"
                value={ownerData.email} onChange={(e) => setOwner("email", e.target.value)} 
            />
            <MobileField 
                value={ownerData.phone} onChange={(v) => setOwner("phone", v)}
            />

            <InputField 
                name="ownerAddress" label="Address" type="text"
                value={ownerData.address} onChange={(e) => setOwner("address", e.target.value)} 
            />
            {isDogsAustraliaRegistered && (
                <InputField 
                    name="memberNumber" label="Member Number" type="text"
                    value={ownerData.memberNumber} onChange={(e) => setOwner("memberNumber", e.target.value)} 
                />
            )}

            {/* -- Veterinarian Details -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Veterinarian Details</h4>
            <InputField 
                name="veterinarianName" label="Veterinarian Name *" type="text"
                value={vetData.veterinarianName} onChange={(e) => setVet("veterinarianName", e.target.value)} 
            />
            <InputField 
                name="practiceName" label="Practice Name *" type="text"
                value={vetData.practiceName} onChange={(e) => setVet("practiceName", e.target.value)} 
            />
            <InputField 
                name="vetAddress" label="Address" type="text"
                value={vetData.address} onChange={(e) => setVet("address", e.target.value)} 
            />
            <MobileField 
                value={vetData.phone} onChange={(v) => setVet("phone", v)} 
            />
            <InputField 
                name="positiveIdentificationSighted" label="Positive Identification Sighted" type="checkbox"
                value={vetData.positiveIdentificationSighted}
                onChange={(e) => setVet("positiveIdentificationSighted", e.target.checked)} 
            />
            <InputField 
                name="certificateOfRegistrationSighted" label="Certificate of Registration Sighted" type="checkbox"
                value={vetData.certificateOfRegistrationSighted}
                onChange={(e) => setVet("certificateOfRegistrationSighted", e.target.checked)} 
            />

            {/* -- Files -- */}
            <h4 className="mt-8 text-lg font-semibold text-gray-800">Files</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">DICOM Files *</p>
                    <p className="text-xs text-gray-500">.dcm - one or more</p>
                    <input key={resetKey} type="file" accept=".dcm" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => onDicomChange(Array.from(e.target.files ?? []))} />
                    {selectedDicom.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDicom.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Supporting Documents</p>
                    <p className="text-xs text-gray-500">.pdf - one or more</p>
                    <input key={resetKey} type="file" accept=".pdf" multiple
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => onDocsChange(Array.from(e.target.files ?? []))} />
                    {selectedDocs.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {selectedDocs.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Owner Signature *</p>
                    <p className="text-xs text-gray-500">.png / .jpg - one file</p>
                    <input key={resetKey} type="file" accept=".png,.jpg,.jpeg"
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => onOwnerSigChange(e.target.files?.[0] ?? null)} />
                    {ownerSigFile && <p className="mt-2 truncate text-xs text-gray-600">{ownerSigFile.name}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Veterinarian Signature *</p>
                    <p className="text-xs text-gray-500">.png / .jpg - one file</p>
                    <input key={resetKey} type="file" accept=".png,.jpg,.jpeg"
                        className="mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300"
                        onChange={(e) => onVetSigChange(e.target.files?.[0] ?? null)} />
                    {vetSigFile && <p className="mt-2 truncate text-xs text-gray-600">{vetSigFile.name}</p>}
                </div>
            </div>
        </>
    );
};
