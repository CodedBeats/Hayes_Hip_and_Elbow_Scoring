interface PolicySectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

export const PolicySection = ({ icon, title, children }: PolicySectionProps) => (
    <section className="flex flex-col gap-3 border-b border-brand-brown/10 py-6 last:border-b-0">
        <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-warm-sand">
                {icon}
            </span>
            <h2 className="text-xl font-semibold text-brand-brown sm:text-2xl">{title}</h2>
        </div>
        <div className="pl-12 text-sm leading-relaxed text-gray-600 sm:text-base">
            {children}
        </div>
    </section>
);
