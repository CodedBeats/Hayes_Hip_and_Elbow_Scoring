"use client";

type Props = {
    pdfFormFile: File | null;
    selectedDicom: File[];
    selectedDocs: File[];
    ownerSigFile: File | null;
    vetSigFile: File | null;
    onPdfFormChange: (file: File | null) => void;
    onDicomChange: (files: File[]) => void;
    onDocsChange: (files: File[]) => void;
    onOwnerSigChange: (file: File | null) => void;
    onVetSigChange: (file: File | null) => void;
};

const fileBoxClass = "rounded-xl border border-gray-200 bg-gray-50 p-4";
const inputClass = "mt-3 block w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs hover:file:bg-gray-300";

export const DogEntryPdfForm = ({
    pdfFormFile, selectedDicom, selectedDocs, ownerSigFile, vetSigFile,
    onPdfFormChange, onDicomChange, onDocsChange, onOwnerSigChange, onVetSigChange,
}: Props) => {
    return (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={fileBoxClass}>
                <p className="text-sm font-medium text-gray-800">
                    Canine Hip & Elbow Dysplasia Scheme Submission Form *
                </p>
                <p className="text-xs text-gray-500">.pdf - one file</p>
                <input type="file" accept=".pdf" className={inputClass}
                    onChange={(e) => onPdfFormChange(e.target.files?.[0] ?? null)} />
                {pdfFormFile && <p className="mt-2 truncate text-xs text-gray-600">{pdfFormFile.name}</p>}
            </div>

            <div className={fileBoxClass}>
                <p className="text-sm font-medium text-gray-800">DICOM Files *</p>
                <p className="text-xs text-gray-500">.dcm - one or more</p>
                <input type="file" accept=".dcm" multiple className={inputClass}
                    onChange={(e) => onDicomChange(Array.from(e.target.files ?? []))} />
                {selectedDicom.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                        {selectedDicom.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                    </ul>
                )}
            </div>

            <div className={fileBoxClass}>
                <p className="text-sm font-medium text-gray-800">Supporting Documents</p>
                <p className="text-xs text-gray-500">.pdf - one or more</p>
                <input type="file" accept=".pdf" multiple className={inputClass}
                    onChange={(e) => onDocsChange(Array.from(e.target.files ?? []))} />
                {selectedDocs.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                        {selectedDocs.map((f) => <li key={f.name} className="truncate text-xs text-gray-600">{f.name}</li>)}
                    </ul>
                )}
            </div>

            <div className={fileBoxClass}>
                <p className="text-sm font-medium text-gray-800">Owner Signature</p>
                <p className="text-xs text-gray-500">.png / .jpg - one file</p>
                <input type="file" accept=".png,.jpg,.jpeg" className={inputClass}
                    onChange={(e) => onOwnerSigChange(e.target.files?.[0] ?? null)} />
                {ownerSigFile && <p className="mt-2 truncate text-xs text-gray-600">{ownerSigFile.name}</p>}
            </div>

            <div className={fileBoxClass}>
                <p className="text-sm font-medium text-gray-800">Veterinarian Signature</p>
                <p className="text-xs text-gray-500">.png / .jpg - one file</p>
                <input type="file" accept=".png,.jpg,.jpeg" className={inputClass}
                    onChange={(e) => onVetSigChange(e.target.files?.[0] ?? null)} />
                {vetSigFile && <p className="mt-2 truncate text-xs text-gray-600">{vetSigFile.name}</p>}
            </div>
        </div>
    );
};
