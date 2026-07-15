import { CasesListSection } from "@/components/admin/CasesListSection";
import { getAllSubmissions } from "@/lib/firebaseAdmin";

// Always render on request rather than prerender at build time - admin case data changes
// constantly, and static generation would otherwise require live Firestore credentials
// just to build.
export const dynamic = "force-dynamic";

const ArchivePage = async () => {
    const allSubmissions = await getAllSubmissions();
    const cases = allSubmissions
        .filter((s) => s.status === "archived")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="flex flex-col gap-6">
            <CasesListSection
                submissions={cases}
                tableTitle="Archived Cases"
                topBarTitle="Welcome back"
                topBarSubtitle="Manage veterinary scoring cases"
            />
        </div>
    );
};

export default ArchivePage;
