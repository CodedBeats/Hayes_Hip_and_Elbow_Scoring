import { CasesListSection } from "@/components/admin/CasesListSection";
import { getAllSubmissions } from "@/lib/firebaseAdmin";

// Always render on request rather than prerender at build time - admin case data changes
// constantly, and static generation would otherwise require live Firestore credentials
// just to build.
export const dynamic = "force-dynamic";

const PendingReviewsPage = async () => {
    const allSubmissions = await getAllSubmissions();
    const cases = allSubmissions
        .filter((s) => (s.status === "pendingReview" || s.status === "reviewing") && s.billing.paymentStatus !== "unpaid")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="flex flex-col gap-6">
            <CasesListSection
                submissions={cases}
                tableTitle="Pending Review Cases"
                topBarTitle="Welcome back"
                topBarSubtitle="Manage veterinary scoring cases"
            />
        </div>
    );
};

export default PendingReviewsPage;
