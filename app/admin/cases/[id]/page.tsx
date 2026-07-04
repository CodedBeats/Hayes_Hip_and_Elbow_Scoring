import { notFound } from "next/navigation";
import Link from "next/link";
import { mockSubmissions } from "@/lib/mockSubmissions";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatusPill } from "@/components/admin/StatusPill";
import { ChangeStatusButton } from "@/components/admin/ChangeStatusButton";
import { DogDetailsCard } from "@/components/admin/DogDetailsCard";
import { OwnerInfoCard } from "@/components/admin/OwnerInfoCard";
import { VetPracticeCard } from "@/components/admin/VetPracticeCard";
import { AssetManagementCard } from "@/components/admin/AssetManagementCard";
import { SupportingDocumentsCard } from "@/components/admin/SupportingDocumentsCard";
import { ArrowLeftIcon } from "@/components/misc/Icons";

const formatSubmittedAt = (date: Date) =>
    date.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" }) +
    " • " +
    date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

interface CasePageProps {
    params: Promise<{ id: string }>;
}

const CasePage = async ({ params }: CasePageProps) => {
    const { id } = await params;
    const submission = mockSubmissions.find((s) => s.id === id);

    if (!submission) {
        notFound();
    }

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
                <ChangeStatusButton currentStatus={submission.status} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <DogDetailsCard dog={submission.dog} />
                <OwnerInfoCard owner={submission.owner} />
            </div>

            <AssetManagementCard
                dicomFiles={submission.files.dicomFiles}
                ownerSignature={submission.files.ownerSignature}
                veterinarianSignature={submission.files.veterinarianSignature}
                pdfForm={submission.submissionType === "pdf" ? submission.files.pdfForm : undefined}
            />

            <SupportingDocumentsCard files={submission.files.supportingDocuments} />

            <VetPracticeCard vet={submission.veterinarian} radiographDate={submission.dog.dateOfRadiograph} />
        </div>
    );
};

export default CasePage;
