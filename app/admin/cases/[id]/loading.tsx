// Next.js route-level loading convention: shown automatically while the async page
// component (Firestore read + per-file S3 presigning/metadata calls) resolves.
const CaseLoading = () => (
    <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading case...</p>
    </div>
);

export default CaseLoading;
