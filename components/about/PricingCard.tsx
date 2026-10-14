interface PricingCardProps {
    label: string;
    memberLevy: number;
    memberFee: number;
    memberTotal: number;
    nonMemberLevy: number;
    nonMemberFee: number;
    nonMemberTotal: number;
}

export const PricingCard = ({
    label,
    memberLevy,
    memberFee,
    memberTotal,
    nonMemberLevy,
    nonMemberFee,
    nonMemberTotal,
}: PricingCardProps) => {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-green-mid/20 bg-white p-6">
            <h3 className="text-lg font-bold text-brand-brown">{label}</h3>
            <div className="flex flex-col gap-1">
                <p className="text-2xl font-bold text-brand-green">
                    ${memberTotal}<span className="align-super text-sm">*</span>{" "}
                    <span className="text-sm font-medium text-gray-600">Dogs Australia members</span>
                </p>
                <p className="text-2xl font-bold text-brand-green">
                    ${nonMemberTotal}<span className="align-super text-sm">^</span>{" "}
                    <span className="text-sm font-medium text-gray-600">non-members</span>
                </p>
            </div>
            <div className="flex flex-col text-xs text-gray-500">
                <p>*includes ${memberLevy} ANKC levy + ${memberFee} payment processing fee</p>
                <p>^includes ${nonMemberLevy} ANKC levy + ${nonMemberFee} payment processing fee</p>
            </div>
        </div>
    );
};
