export default function CancelPage() {
    return (
        <div className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-8 text-center">
            <p className="text-2xl font-bold text-yellow-700">Payment Cancelled</p>
            <p className="mt-2 text-sm text-gray-600">
                Your submission was saved but payment was not completed. You can return and try again.
            </p>
        </div>
    );
}
