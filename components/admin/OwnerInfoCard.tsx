import type { OwnerDetails } from "@/types/owner";
import { PersonIcon, EnvelopeIcon, PhoneIcon } from "@/components/misc/Icons";

interface OwnerInfoCardProps {
    owner: OwnerDetails;
}

export const OwnerInfoCard = ({ owner }: OwnerInfoCardProps) => {
    return (
        <div className="rounded-2xl border border-warm-sand bg-warm-sand/40 p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <PersonIcon />
                <h3 className="text-lg font-bold text-brand-brown">Owner</h3>
            </div>

            <p className="mt-4 font-semibold text-brand-brown">{owner.name}</p>

            <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <EnvelopeIcon />
                    <span>{owner.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <PhoneIcon />
                    <span>{owner.phone}</span>
                </div>
            </div>

            <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Address</p>
                <p className="mt-1 text-sm text-gray-700">{owner.address}</p>
            </div>

            <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Member Number</p>
                <p className="mt-1 text-sm text-gray-700">{owner.memberNumber}</p>
            </div>
        </div>
    );
};
