interface PdfSubmissionNoticeProps {
    title: string;
}

// Shown in place of DogDetailsCard/OwnerInfoCard/VetPracticeCard for submissionType
// "pdf" cases, which never capture structured owner/dog/vet data digitally - everything
// the owner/vet filled in only exists inside the attached PDF form file.
export const PdfSubmissionNotice = ({ title }: PdfSubmissionNoticeProps) => {
    return (
        <div className="flex flex-col items-start justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-brand-brown">{title}</h3>
            <p className="mt-3 text-sm text-gray-500">
                N/A — submitted via PDF form. All data for this section can be found in the attached PDF form below.
            </p>
        </div>
    );
};
