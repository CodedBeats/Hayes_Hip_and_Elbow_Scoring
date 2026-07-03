interface CredentialChipProps {
    icon: React.ReactNode;
    label: string;
    className?: string;
}

export const CredentialChip = ({ icon, label, className = "" }: CredentialChipProps) => (
    <div
        className={[
            "flex items-center gap-2 rounded-full bg-warm-sand px-4 py-2 text-sm font-medium text-brand-brown",
            className,
        ].join(" ")}
    >
        {icon}
        {label}
    </div>
);
