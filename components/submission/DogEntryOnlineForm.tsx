"use client";
// form components
import { InputField } from "../form/InputField";
import { MobileField } from "../form/MobileField";
import { UploadBox } from "../form/UploadBox"
import { UploadedFileList } from "../form/UploadedFileList"
// icons
import { DogIcon, PersonIcon, ScanIcon, DocumentIcon, CloudIcon } from "../misc/Icons"
// lib
import { MAX_FILES_PER_DOG } from "@/lib/uploadLimits";
// types
import type { DogEntryFormData, ExamType } from "@/types/form";
import type { OwnerDetails } from "@/types/owner";
import type { Files } from "@/types/submission";
import type { UploadedFile } from "@/types/upload";

type Props = {
    isDogsAustraliaRegistered: boolean;
    dogData: DogEntryFormData;
    ownerData: OwnerDetails;
    setDog: (field: keyof DogEntryFormData, value: string | boolean) => void;
    setOwner: (field: keyof OwnerDetails, value: string) => void;
    pdfFormFile: File | null;
    selectedDicom: File[];
    selectedDocs: File[];
    onPdfFormChange: (file: File | null) => void;
    onDicomChange: (files: File[]) => void;
    onDocsChange: (files: File[]) => void;
    resetKey: number;
    uploadedFiles: Files | null;
    duplicatePdfFormNames: string[];
    duplicateDicomNames: string[];
    duplicateDocsNames: string[];
    onDeleteFile: (category: keyof Files, file: UploadedFile) => void;
    // the upload steps + button, rendered at the top of the Uploads card. Passed in
    // as an element so this form doesn't need to know about the upload state
    uploadActions: React.ReactNode;
};


const SectionHeader = ({ number, icon, title }: { number: number; icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
            {number}
        </span>
        {icon}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
);

// clinics usually take several views of each joint, and without this people upload every
// image they took - the scorer only needs one good image per joint
const DICOM_IMAGES_NEEDED: Record<ExamType, string> = {
    hipsAndElbows: "Only 3 images are needed: one of the pelvis and one of each elbow.",
    hipsOnly: "Only 1 image is needed: one of the pelvis.",
    elbowsOnly: "Only 2 images are needed: one of each elbow.",
};

const styledSelectClass = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition";

// ---- main component ----
export const DogEntryOnlineForm = ({
    isDogsAustraliaRegistered,
    dogData,
    ownerData,
    setDog,
    setOwner,
    pdfFormFile,
    selectedDicom,
    selectedDocs,
    onPdfFormChange,
    onDicomChange,
    onDocsChange,
    resetKey,
    uploadedFiles,
    duplicatePdfFormNames,
    duplicateDicomNames,
    duplicateDocsNames,
    onDeleteFile,
    uploadActions,
}: Props) => {
    return (
        <div className="space-y-4">
            {/* ---- Card 1: Dog Details ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    number={1}
                    icon={<DogIcon />}
                    title="Dog Details"
                />

                {/* Registration toggle */}
                <div className="mb-5">
                    <p className="mb-1 text-sm font-medium text-gray-700">
                        Dogs Australia Registration
                    </p>
                    {/* Overseas submitters were picking "Registered" for local-club registrations, underpaying at checkout */}
                    <p className="mb-3 text-xs text-gray-500">
                        Only select <span className="font-semibold">Registered</span> if your dog is registered with Dogs Australia.
                        Dogs registered with an overseas kennel club (e.g. The Kennel Club UK, AKC) should select{" "}
                        <span className="font-semibold">Not Registered</span>.
                    </p>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`daReg-${dogData.registeredName}`}
                                checked={isDogsAustraliaRegistered}
                                onChange={() =>
                                    setDog("isDogsAustraliaRegistered", true)
                                }
                                className="h-4 w-4 border-gray-300 accent-[#506147]"
                            />
                            <span className="text-sm text-gray-700">
                                Registered
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`daReg-${dogData.registeredName}`}
                                checked={!isDogsAustraliaRegistered}
                                onChange={() =>
                                    setDog("isDogsAustraliaRegistered", false)
                                }
                                className="h-4 w-4 border-gray-300 accent-[#506147]"
                            />
                            <span className="text-sm text-gray-700">
                                Not Registered
                            </span>
                        </label>
                    </div>
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <InputField
                        name="registeredName"
                        label={
                            isDogsAustraliaRegistered
                                ? "Registered Name *"
                                : "Dog Name *"
                        }
                        type="text"
                        placeholder={
                            isDogsAustraliaRegistered
                                ? "e.g. Australian Champion Bluey"
                                : "Dog's name"
                        }
                        value={dogData.registeredName}
                        onChange={(e) =>
                            setDog("registeredName", e.target.value)
                        }
                    />
                    {isDogsAustraliaRegistered ? (
                        <InputField
                            name="registeredNumber"
                            label="Registration Number"
                            type="text"
                            placeholder="Enter Registration Number"
                            value={dogData.registeredNumber}
                            onChange={(e) =>
                                setDog("registeredNumber", e.target.value)
                            }
                        />
                    ) : (
                        <div />
                    )}

                    <InputField
                        name="microchipNumber"
                        label="Microchip Number *"
                        type="text"
                        placeholder="15-digit code"
                        value={dogData.microchipNumber}
                        onChange={(e) =>
                            setDog("microchipNumber", e.target.value)
                        }
                    />

                    <div className="mb-4 w-full">
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                            Breed *
                        </label>
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
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                            Sex *
                        </label>
                        <select
                            value={dogData.sex}
                            onChange={(e) =>
                                setDog(
                                    "sex",
                                    e.target.value as "male" | "female",
                                )
                            }
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
                <SectionHeader
                    number={2}
                    icon={<PersonIcon />}
                    title="Owner Details"
                />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <InputField
                        name="ownerName"
                        label="Full Name *"
                        type="text"
                        value={ownerData.name}
                        onChange={(e) => setOwner("name", e.target.value)}
                        autoComplete="name"
                    />
                    <InputField
                        name="ownerEmail"
                        label="Email Address *"
                        type="email"
                        value={ownerData.email}
                        onChange={(e) => setOwner("email", e.target.value)}
                        autoComplete="email"
                    />
                </div>

                <InputField
                    name="ownerAddress"
                    label="Mailing Address"
                    type="text"
                    value={ownerData.address}
                    onChange={(e) => setOwner("address", e.target.value)}
                    autoComplete="street-address"
                />

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <MobileField
                        name="ownerPhone"
                        value={ownerData.phone}
                        onChange={(v) => setOwner("phone", v)}
                        autoComplete="tel"
                    />
                    {isDogsAustraliaRegistered && (
                        <InputField
                            name="memberNumber"
                            label="Dogs Australia Member Number (Optional)"
                            type="text"
                            value={ownerData.memberNumber}
                            onChange={(e) =>
                                setOwner("memberNumber", e.target.value)
                            }
                        />
                    )}
                </div>
            </div>

            {/* ---- Card 3: Uploads ---- */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    number={3}
                    icon={<ScanIcon />}
                    title="Uploads"
                />

                {uploadActions}

                {/* Signed PDF submission form */}
                <UploadBox
                    label="Canine Hip & Elbow Dysplasia Scheme Submission Form"
                    hint="Click to upload the completed & signed PDF submission form, or a photo of it"
                    icon={<DocumentIcon />}
                    isRequired
                    file={pdfFormFile}
                    onChange={onPdfFormChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    resetKey={resetKey}
                    isUploaded={!!uploadedFiles?.pdfForm}
                    duplicateFileNames={duplicatePdfFormNames}
                />
                <UploadedFileList
                    files={ uploadedFiles?.pdfForm ? [uploadedFiles.pdfForm] : [] }
                    onDelete={(file) => onDeleteFile("pdfForm", file)}
                />

                <div className="mt-15" />
                {/* DICOM upload zone */}
                <UploadBox
                    label="DICOM Files"
                    hint="Click to select the .dcm files for Hips and/or Elbows. Select them all at once (hold Ctrl, or Cmd on Mac)"
                    icon={<CloudIcon />}
                    isRequired
                    description={`${DICOM_IMAGES_NEEDED[dogData.examType]} Please choose your best image of each instead of uploading every image taken.`}
                    files={selectedDicom}
                    isMultiple
                    onMultiChange={onDicomChange}
                    accept=".dcm"
                    resetKey={resetKey}
                    uploadedCount={uploadedFiles?.dicomFiles.length ?? 0}
                    maxFiles={MAX_FILES_PER_DOG.dicom}
                    duplicateFileNames={duplicateDicomNames}
                />
                <UploadedFileList
                    files={uploadedFiles?.dicomFiles ?? []}
                    onDelete={(file) => onDeleteFile("dicomFiles", file)}
                />

                <div className="mt-15" />
                {/* Supporting documents */}
                <UploadBox
                    label="Supporting Documents"
                    hint="Click to upload supporting documents"
                    icon={<DocumentIcon />}
                    isRequired
                    description={"Please upload the Dogs Australia pedigree certificate, or if your dog is not registered with Dogs Australia then, please upload a registration certificate or other document confirming dog's details, including date of birth, sex, and microchip number."}
                    files={selectedDocs}
                    isMultiple
                    onMultiChange={onDocsChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    resetKey={resetKey}
                    uploadedCount={uploadedFiles?.supportingDocuments.length ?? 0}
                    maxFiles={MAX_FILES_PER_DOG["supporting-documents"]}
                    duplicateFileNames={duplicateDocsNames}
                />
                <UploadedFileList
                    files={uploadedFiles?.supportingDocuments ?? []}
                    onDelete={(file) => onDeleteFile("supportingDocuments", file)}
                />
            </div>
        </div>
    );
};
