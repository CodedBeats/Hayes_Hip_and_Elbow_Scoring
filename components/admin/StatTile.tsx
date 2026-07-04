interface StatTileProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    tone: "green" | "orange" | "blue";
}

const toneClasses: Record<StatTileProps["tone"], string> = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
};

export const StatTile = ({ icon, label, value, tone }: StatTileProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
                {icon}
            </span>
            <p className="mt-4 text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-brown">{value}</p>
        </div>
    );
};
