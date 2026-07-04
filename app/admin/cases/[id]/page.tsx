import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubmissionById } from "@/lib/firebaseAdmin";
import { enrichUploadedFile } from "@/lib/s3";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatusPill } from "@/components/admin/StatusPill";
import { ChangeStatusButton } from "@/components/admin/ChangeStatusButton";
import { DogDetailsCard } from "@/components/admin/DogDetailsCard";
import { OwnerInfoCard } from "@/components/admin/OwnerInfoCard";
import { VetPracticeCard } from "@/components/admin/VetPracticeCard";
import { PdfSubmissionNotice } from "@/components/admin/PdfSubmissionNotice";
import { AssetManagementCard } from "@/components/admin/AssetManagementCard";
import { SupportingDocumentsCard } from "@/components/admin/SupportingDocumentsCard";
import { ArrowLeftIcon } from "@/components/misc/Icons";
import type { UploadedFile } from "@/types/upload";

// Always render on request rather than prerender at build time - this page depends on
// the dynamic [id] param plus live Firestore/S3 reads, neither of which are available
// (or meaningful) at build time.
export const dynamic = "force-dynamic";

const formatSubmittedAt = (date: Date) =>
    date.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" }) +
    " • " +
    date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

// Only undefined/null goes through unenriched - real files get backfilled with S3 data.
const enrichIfPresent = (file: UploadedFile | undefined) => (file ? enrichUploadedFile(file) : Promise.resolve(undefined));

interface CasePageProps {
    params: Promise<{ id: string }>;
}

const CasePage = async ({ params }: CasePageProps) => {
    const { id } = await params;
    const submission = await getSubmissionById(id);

    if (!submission) {
        notFound();
    }

    // File-related S3 work (presigned download URLs + HeadObject metadata) only happens
    // here, on the single-case page, and only for files this page actually renders -
    // never on the list views, which don't show any file data at all. Running every file
    // through this in parallel is what the sibling loading.tsx is covering for.
    const [dicomFiles, supportingDocuments, ownerSignature, veterinarianSignature, pdfForm] = await Promise.all([
        Promise.all(submission.files.dicomFiles.map(enrichUploadedFile)),
        Promise.all(submission.files.supportingDocuments.map(enrichUploadedFile)),
        enrichIfPresent(submission.files.ownerSignature),
        enrichIfPresent(submission.files.veterinarianSignature),
        enrichIfPresent(submission.submissionType === "pdf" ? submission.files.pdfForm : undefined),
    ]);

    const isPdfSubmission = submission.submissionType === "pdf";

    return (
        <div className="flex flex-col gap-6">
            <AdminTopBar title="Welcome back" subtitle="Manage veterinary scoring cases" />

            <Link
                href="/admin"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-brown transition"
            >
                <ArrowLeftIcon />
                Back to Cases
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-brown">Case #{submission.id}</h1>
                    <div className="mt-2 flex items-center gap-3">
                        <StatusPill status={submission.status} />
                        <span className="text-sm text-gray-500">
                            Submitted {formatSubmittedAt(submission.createdAt)}
                        </span>
                    </div>
                </div>
                <ChangeStatusButton submissionId={id} currentStatus={submission.status} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                {isPdfSubmission ? (
                    <PdfSubmissionNotice title="Dog Details" />
                ) : (
                    <DogDetailsCard dog={submission.dog} />
                )}
                {isPdfSubmission ? (
                    <PdfSubmissionNotice title="Owner" />
                ) : (
                    <OwnerInfoCard owner={submission.owner} />
                )}
            </div>

            <AssetManagementCard
                dicomFiles={dicomFiles}
                ownerSignature={ownerSignature}
                veterinarianSignature={veterinarianSignature}
                pdfForm={pdfForm}
            />

            <SupportingDocumentsCard files={supportingDocuments} />

            {isPdfSubmission ? (
                <PdfSubmissionNotice title="Veterinary Practice Information" />
            ) : (
                <VetPracticeCard vet={submission.veterinarian} radiographDate={submission.dog.dateOfRadiograph} />
            )}
        </div>
    );
};

export default CasePage;
