interface PillProps {
    children: React.ReactNode;
    className?: string;
}

export const Pill = ({
    children,
    className = "inline-flex items-center rounded-full bg-brand-green-mid/15 text-brand-green text-xs font-semibold px-4 py-1.5",
}: PillProps) => <span className={className}>{children}</span>;
