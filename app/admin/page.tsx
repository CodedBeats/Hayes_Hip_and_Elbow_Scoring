import { StatTile } from "@/components/admin/StatTile";
import { CasesListSection } from "@/components/admin/CasesListSection";
import { getAllSubmissions } from "@/lib/firebaseAdmin";
import { ClipboardIcon, ScanIcon, CheckCircleIcon } from "@/components/misc/Icons";

// Always render on request rather than prerender at build time - admin case data changes
// constantly, and static generation would otherwise require live Firestore credentials
// just to build.
export const dynamic = "force-dynamic";

const AdminDashboardPage = async () => {
    const allSubmissions = await getAllSubmissions();

    const cases = allSubmissions
        .filter((s) => s.status !== "draft" && !s.archived)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalActive = allSubmissions.filter(
        (s) => s.status === "pendingReview" || s.status === "reviewing",
    ).length;
    const pendingReviews = allSubmissions.filter(
        (s) => s.status === "pendingReview",
    ).length;
    const completedAndArchived = allSubmissions.filter(
        (s) => s.archived,
    ).length;

    return (
        <div className="flex flex-col gap-6">
            <CasesListSection
                submissions={cases}
                tableTitle="Case Submissions"
                topBarTitle="Welcome back"
                topBarSubtitle="Manage veterinary scoring cases"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatTile
                        icon={<ClipboardIcon className="h-5 w-5" />}
                        label="Total Active Cases"
                        value={totalActive}
                        tone="green"
                    />
                    <StatTile
                        icon={<ScanIcon className="h-5 w-5" />}
                        label="Pending Reviews"
                        value={pendingReviews}
                        tone="orange"
                    />
                    <StatTile
                        icon={<CheckCircleIcon className="h-5 w-5" />}
                        label="Completed & Archived"
                        value={completedAndArchived}
                        tone="blue"
                    />
                </div>
            </CasesListSection>
        </div>
    );
};

export default AdminDashboardPage;
