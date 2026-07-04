import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatTile } from "@/components/admin/StatTile";
import { CasesTable } from "@/components/admin/CasesTable";
import { mockSubmissions } from "@/lib/mockSubmissions";
import { ClipboardIcon, ScanIcon, CheckCircleIcon } from "@/components/misc/Icons";

const AdminDashboardPage = () => {
    const cases = mockSubmissions
        .filter((s) => s.status !== "draft")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="flex flex-col gap-6">
            <AdminTopBar title="Welcome back" subtitle="Manage veterinary scoring cases" />

            {/* Stat values are static until wired up to real Firestore counts. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile
                    icon={<ClipboardIcon className="h-5 w-5" />}
                    label="Total Active Cases"
                    value={0}
                    tone="green"
                />
                <StatTile
                    icon={<ScanIcon className="h-5 w-5" />}
                    label="Pending Reviews"
                    value={0}
                    tone="orange"
                />
                <StatTile
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                    label="Completed & Archived"
                    value={0}
                    tone="blue"
                />
            </div>

            <CasesTable submissions={cases} title="Case Submissions" />
        </div>
    );
};

export default AdminDashboardPage;
