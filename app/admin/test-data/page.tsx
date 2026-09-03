// lib
import { getTestSubmissions } from "@/lib/firebaseAdmin";
// components
import { CasesListSection } from "@/components/admin/CasesListSection";
import { DeprecatedDataBanner } from "@/components/admin/DeprecatedDataBanner";
import { CreateTestSubmissionButton } from "@/components/admin/CreateTestSubmissionButton";

// Same reasoning as the other admin list pages (app/admin/page.tsx, app/admin/archive/page.tsx) -
// this depends on a live Firestore read, not build-time data.
export const dynamic = "force-dynamic";

const TestDataPage = async () => {
    const submissions = await getTestSubmissions();
    const cases = submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="flex flex-col gap-6">
            <DeprecatedDataBanner />
            <CasesListSection
                submissions={cases}
                tableTitle="Deprecated Test Data"
                topBarTitle="Test data archive"
                topBarSubtitle="Pre-launch test submissions, kept for reference only"
                detailBasePath="/admin/test-data"
            >
                <CreateTestSubmissionButton />
            </CasesListSection>
        </div>
    );
};

export default TestDataPage;
