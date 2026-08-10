// types
import type { ClinicInfo } from "@/types/clinic";
import type { BillingInfo } from "@/types/billing";
// components
import { BriefcaseIcon } from "@/components/misc/Icons";

interface SubmitterBillingCardProps {
    submitterType: "owner" | "clinic";
    clinicInfo?: ClinicInfo;
    payer: "owner" | "clinic";
    billing: BillingInfo;
}

const BILLING_TYPE_LABEL: Record<BillingInfo["billingType"], string> = {
    payNow: "Pay Now",
    invoice: "Invoice",
    batchMonthly: "Batch Monthly",
};

export const SubmitterBillingCard = ({ submitterType, clinicInfo, payer, billing }: SubmitterBillingCardProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green-mid/15">
                    <BriefcaseIcon className="h-5 w-5 text-brand-green-mid" />
                </span>
                <h3 className="text-lg font-bold text-brand-brown">Submitter & Billing</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
                <div>
                    <p className="text-gray-500">Submitted By</p>
                    <p className="mt-0.5 font-semibold text-brand-brown capitalize">{submitterType}</p>
                </div>
                <div>
                    <p className="text-gray-500">Billed To</p>
                    <p className="mt-0.5 font-semibold text-brand-brown capitalize">{payer}</p>
                </div>
                <div>
                    <p className="text-gray-500">Payment Timing</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{BILLING_TYPE_LABEL[billing.billingType]}</p>
                </div>
                <div>
                    <p className="text-gray-500">Payment Status</p>
                    <p className="mt-0.5 font-semibold text-brand-brown capitalize">{billing.paymentStatus}</p>
                </div>
            </div>

            {submitterType === "clinic" && clinicInfo && (
                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
                    <div>
                        <p className="text-gray-500">Clinic Name</p>
                        <p className="mt-0.5 font-semibold text-brand-brown">{clinicInfo.clinicName}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Contact Name</p>
                        <p className="mt-0.5 font-semibold text-brand-brown">{clinicInfo.contactName}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Clinic Email</p>
                        <p className="mt-0.5 font-semibold text-brand-brown">{clinicInfo.email}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Clinic Phone</p>
                        <p className="mt-0.5 font-semibold text-brand-brown">{clinicInfo.phone}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
