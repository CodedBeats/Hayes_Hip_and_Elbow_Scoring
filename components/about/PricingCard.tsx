interface PricingCardProps {
    label: string;
    base: number;
    memberTotal: number;
    nonMemberTotal: number;
}

export const PricingCard = ({ label, base, memberTotal, nonMemberTotal }: PricingCardProps) => (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-green-mid/20 bg-white p-6">
        <h3 className="text-lg font-bold text-brand-brown">{label}</h3>
        <p className="text-3xl font-bold text-brand-green">${base}</p>
        <div className="flex flex-col gap-1 text-sm text-gray-600">
            <p>${memberTotal} total — Dogs Australia member (+$10 levy)</p>
            <p>${nonMemberTotal} total — non-member (+$20 levy)</p>
        </div>
    </div>
);
