// dependencies
import { notFound } from "next/navigation";
import Link from "next/link";
// lib
import { getTestSubmissionById } from "@/lib/firebaseAdmin";
import { getAdminCaseDisplayStatus } from "@/lib/status";
import { enrichUploadedFile } from "@/lib/s3";
// types
import type { UploadedFile } from "@/types/upload";
// components
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatusPill } from "@/components/admin/StatusPill";
import { DeprecatedDataBanner } from "@/components/admin/DeprecatedDataBanner";
import { DogDetailsCard } from "@/components/admin/DogDetailsCard";
import { OwnerInfoCard } from "@/components/admin/OwnerInfoCard";
import { SubmitterBillingCard } from "@/components/admin/SubmitterBillingCard";
import { AssetManagementCard } from "@/components/admin/AssetManagementCard";
import { SupportingDocumentsCard } from "@/components/admin/SupportingDocumentsCard";
import { ArrowLeftIcon } from "@/components/misc/Icons";

// Same reasoning as app/admin/cases/[id]/page.tsx - depends on the dynamic [id] param
// plus live Firestore/S3 reads.
export const dynamic = "force-dynamic";

const formatSubmittedAt = (date: Date) =>
    date.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" }) +
    " • " +
    date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

// Only undefined/null goes through unenriched - real files get backfilled with S3 data.
const enrichIfPresent = (file: UploadedFile | undefined) => (file ? enrichUploadedFile(file) : Promise.resolve(undefined));

interface TestDataCasePageProps {
    params: Promise<{ id: string }>;
}

/**
 * Read-only mirror of `app/admin/cases/[id]/page.tsx` for `testSubmissions` docs.
 *
 * @remarks
 * Omits {@link ArchiveButton} and {@link ChangeStatusButton} on purpose - both write to
 * the `submissions` collection, which doesn't apply to these migrated, frozen records.
 */
const TestDataCasePage = async ({ params }: TestDataCasePageProps) => {
    const { id } = await params;
    const submission = await getTestSubmissionById(id);

    if (!submission) {
        notFound();
    }

    const [dicomFiles, supportingDocuments, pdfForm] = await Promise.all([
        Promise.all(submission.files.dicomFiles.map(enrichUploadedFile)),
        Promise.all(submission.files.supportingDocuments.map(enrichUploadedFile)),
        enrichIfPresent(submission.files.pdfForm),
    ]);

    return (
        <div className="flex flex-col gap-6">
            <AdminTopBar title="Test data archive" subtitle="Pre-launch test submissions, kept for reference only" />

            <Link
                href="/admin/test-data"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-brown transition"
            >
                <ArrowLeftIcon />
                Back to Test Data
            </Link>

            <DeprecatedDataBanner />

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-brown">Case #{submission.id}</h1>
                    <div className="mt-2 flex items-center gap-3">
                        <StatusPill status={getAdminCaseDisplayStatus(submission)} />
                        <span className="text-sm text-gray-500">
                            Submitted {formatSubmittedAt(submission.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <DogDetailsCard dog={submission.dog} />
                <OwnerInfoCard owner={submission.owner} />
            </div>

            <AssetManagementCard
                dicomFiles={dicomFiles}
                pdfForm={pdfForm}
            />

            <SupportingDocumentsCard files={supportingDocuments} />

            <SubmitterBillingCard
                submitterType={submission.submitterType}
                clinicInfo={submission.clinicInfo}
                payer={submission.payer}
                billing={submission.billing}
            />
        </div>
    );
};

export default TestDataCasePage;
