"use client";
// form components
import { InputField } from "../form/InputField";
import { MobileField } from "../form/MobileField";
import { UploadBox } from "../form/UploadBox"
// icons
import { DogIcon, PersonIcon, ClipboardIcon, ScanIcon, PenIcon, DocumentIcon } from "../misc/Icons"
// types
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

// ---- shared sub-components ----
const SectionHeader = ({ number, icon, title }: { number: number; icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
            {number}
        </span>
        {icon}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
);

const styledSelectClass = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition";

// ---- main component ----
export const DogEntryOnlineForm = ({
    isDogsAustraliaRegistered,
    dogData, ownerData, vetData,
    setDog, setOwner, setVet,
    selectedDicom, selectedDocs, ownerSigFile, vetSigFile,
    onDicomChange, onDocsChange, onOwnerSigChange, onVetSigChange,
    resetKey,
}: Props) => {
    return (
        <div className="space-y-4">
            {/* ---- Card 1: Dog Details ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader number={1} icon={<DogIcon />} title="Dog Details" />

                {/* Registration toggle */}
                <div className="mb-5">
                    <p className="mb-2 text-sm font-medium text-gray-700">Dogs Australia Registration</p>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`daReg-${dogData.registeredName}`}
                                checked={isDogsAustraliaRegistered}
                                onChange={() => setDog("isDogsAustraliaRegistered", true)}
                                className="h-4 w-4 border-gray-300 accent-[#506147]"
                            />
                            <span className="text-sm text-gray-700">Registered</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`daReg-${dogData.registeredName}`}
                                checked={!isDogsAustraliaRegistered}
                                onChange={() => setDog("isDogsAustraliaRegistered", false)}
                                className="h-4 w-4 border-gray-300 accent-[#506147]"
                            />
                            <span className="text-sm text-gray-700">Not Registered</span>
                        </label>
                    </div>
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <InputField
                        name="registeredName"
                        label={isDogsAustraliaRegistered ? "Registered Name *" : "Dog Name *"}
                        type="text"
                        placeholder={isDogsAustraliaRegistered ? "e.g. Australian Champion Bluey" : "Dog's name"}
                        value={dogData.registeredName}
                        onChange={(e) => setDog("registeredName", e.target.value)}
                    />
                    {isDogsAustraliaRegistered ? (
                        <InputField
                            name="registeredNumber"
                            label="Registration Number"
                            type="text"
                            placeholder="Enter Registration Number"
                            value={dogData.registeredNumber}
                            onChange={(e) => setDog("registeredNumber", e.target.value)}
                        />
                    ) : <div />}

                    <InputField
                        name="microchipNumber"
                        label="Microchip Number *"
                        type="text"
                        placeholder="15-digit code"
                        value={dogData.microchipNumber}
                        onChange={(e) => setDog("microchipNumber", e.target.value)}
                    />

                    <div className="mb-4 w-full">
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Breed *</label>
                        <input
                            type="text"
                            name="breed"
                            placeholder="e.g. Labrador Retriever"
                            value={dogData.breed}
                            onChange={(e) => setDog("breed", e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
                        />
                    </div>

                    <div className="mb-4 w-full">
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Sex *</label>
                        <select
                            value={dogData.sex}
                            onChange={(e) => setDog("sex", e.target.value as "male" | "female")}
                            className={styledSelectClass}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <InputField
                        name="dateOfBirth"
                        label="Date of Birth *"
                        type="date"
                        value={dogData.dateOfBirth}
                        onChange={(e) => setDog("dateOfBirth", e.target.value)}
                    />
                </div>
            </div>

            {/* ---- Card 2: Owner Details ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader number={2} icon={<PersonIcon />} title="Owner Details" />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <InputField
                        name="ownerName"
                        label="Full Name *"
                        type="text"
                        value={ownerData.name}
                        onChange={(e) => setOwner("name", e.target.value)}
                    />
                    <InputField
                        name="ownerEmail"
                        label="Email Address *"
                        type="email"
                        value={ownerData.email}
                        onChange={(e) => setOwner("email", e.target.value)}
                    />
                </div>

                <InputField
                    name="ownerAddress"
                    label="Mailing Address"
                    type="text"
                    value={ownerData.address}
                    onChange={(e) => setOwner("address", e.target.value)}
                />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <MobileField
                        value={ownerData.phone}
                        onChange={(v) => setOwner("phone", v)}
                    />
                    {isDogsAustraliaRegistered && (
                        <InputField
                            name="memberNumber"
                            label="Dogs Australia Member Number (Optional)"
                            type="text"
                            value={ownerData.memberNumber}
                            onChange={(e) => setOwner("memberNumber", e.target.value)}
                        />
                    )}
                </div>

                
                <UploadBox
                    label="Owner Signature"
                    hint="Click to upload Owner signature (PNG/JPG)"
                    icon={<PenIcon />}
                    isRequired
                    file={ownerSigFile}
                    onChange={onOwnerSigChange}
                    accept=".png,.jpg,.jpeg"
                    resetKey={resetKey}
                />
            </div>

            {/* ---- Card 3: Veterinarian Details ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader number={3} icon={<ClipboardIcon />} title="Veterinarian Details" />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <InputField
                        name="veterinarianName"
                        label="Veterinarian Name *"
                        type="text"
                        value={vetData.veterinarianName}
                        onChange={(e) => setVet("veterinarianName", e.target.value)}
                    />
                    <InputField
                        name="practiceName"
                        label="Clinic / Practice Name *"
                        type="text"
                        value={vetData.practiceName}
                        onChange={(e) => setVet("practiceName", e.target.value)}
                    />
                </div>

                <InputField
                    name="vetAddress"
                    label="Practice Address"
                    type="text"
                    value={vetData.address}
                    onChange={(e) => setVet("address", e.target.value)}
                />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <MobileField
                        value={vetData.phone}
                        onChange={(v) => setVet("phone", v)}
                        label="Practice Phone"
                    />
                    <InputField
                        name="dateOfRadiograph"
                        label="Date of Radiograph *"
                        type="date"
                        value={dogData.dateOfRadiograph}
                        onChange={(e) => setDog("dateOfRadiograph", e.target.value)}
                    />
                </div>

                {/* Yes/No radio pairs */}
                <div className="grid grid-cols-1 gap-x-6 mt-1 sm:grid-cols-2">
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-gray-700">Positive ID sighted? (Microchip/Tattoo)</p>
                        <div className="flex gap-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={vetData.positiveIdentificationSighted}
                                    onChange={() => setVet("positiveIdentificationSighted", true)}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!vetData.positiveIdentificationSighted}
                                    onChange={() => setVet("positiveIdentificationSighted", false)}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-gray-700">Certificate sighted?</p>
                        <div className="flex gap-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={vetData.certificateOfRegistrationSighted}
                                    onChange={() => setVet("certificateOfRegistrationSighted", true)}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!vetData.certificateOfRegistrationSighted}
                                    onChange={() => setVet("certificateOfRegistrationSighted", false)}
                                    className="h-4 w-4 border-gray-300 accent-[#506147]"
                                />
                                <span className="text-sm text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                </div>

                
                <UploadBox
                    label="Veterinarian Signature"
                    hint="Click to upload Veterinarian signature (PNG/JPG)"
                    icon={<PenIcon />}
                    isRequired                
                    file={vetSigFile}
                    onChange={onVetSigChange}
                    accept=".png,.jpg,.jpeg"
                    resetKey={resetKey}
                />
            </div>

            {/* ---- Card 4: DICOM Image Upload ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader number={4} icon={<ScanIcon />} title="DICOM Image Upload" />

                {/* DICOM upload zone */}
                <UploadBox
                    label="DICOM Files"
                    hint="Select the .dcm files for Hips and/or Elbows. You can upload multiple files simultaneously."
                    icon={<PenIcon />}
                    isRequired
                    files={selectedDicom}
                    isMultiple
                    onMultiChange={onDicomChange}
                    accept=".dcm"
                    resetKey={resetKey}
                />

                {/* Supporting documents */}
                <UploadBox
                    label="Supporting Documents"
                    hint="Click to upload supporting PDF documents (optional)"
                    icon={<DocumentIcon />}
                    files={selectedDocs}
                    isMultiple
                    onMultiChange={onDocsChange}
                    accept=".pdf"
                    resetKey={resetKey}
                />
            </div>
        </div>
    );
};
