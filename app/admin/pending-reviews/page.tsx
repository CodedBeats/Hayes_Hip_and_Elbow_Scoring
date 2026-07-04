import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { CasesTable } from "@/components/admin/CasesTable";
import { mockSubmissions } from "@/lib/mockSubmissions";

const PendingReviewsPage = () => {
    const cases = mockSubmissions
        .filter((s) => s.status === "pendingReview" || s.status === "reviewing")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="flex flex-col gap-6">
            <AdminTopBar title="Welcome back" subtitle="Manage veterinary scoring cases" />
            <CasesTable submissions={cases} title="Pending Review Cases" />
        </div>
    );
};

export default PendingReviewsPage;
