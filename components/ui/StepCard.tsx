interface StepCardProps {
    step: number;
    icon: React.ReactNode;
    title: string;
    description: string;
}

export const StepCard = ({ step, icon, title, description }: StepCardProps) => (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-warm-sand">
            {icon}
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[11px] font-bold text-white">
                {step}
            </span>
        </div>
        <h3 className="text-base font-bold text-brand-brown">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
);
