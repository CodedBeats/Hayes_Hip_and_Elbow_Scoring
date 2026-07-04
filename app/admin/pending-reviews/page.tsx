import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { CasesTable } from "@/components/admin/CasesTable";
import { getAllSubmissions } from "@/lib/firebaseAdmin";

// Always render on request rather than prerender at build time - admin case data changes
// constantly, and static generation would otherwise require live Firestore credentials
// just to build.
export const dynamic = "force-dynamic";

const PendingReviewsPage = async () => {
    const allSubmissions = await getAllSubmissions();
    const cases = allSubmissions
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
