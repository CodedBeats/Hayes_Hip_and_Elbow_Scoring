interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: "center" | "left";
    className?: string;
}

export const SectionHeading = ({
    eyebrow,
    title,
    subtitle,
    align = "center",
    className = "",
}: SectionHeadingProps) => (
    <div
        className={[
            "flex flex-col gap-3",
            align === "center" ? "items-center text-center" : "items-start text-left",
            className,
        ].join(" ")}
    >
        {eyebrow && (
            <span className="inline-flex items-center rounded-full bg-brand-green text-white text-xs font-semibold uppercase tracking-wider px-4 py-1">
                {eyebrow}
            </span>
        )}
        <h2 className="text-3xl font-bold text-brand-brown sm:text-4xl">{title}</h2>
        {subtitle && (
            <p className="max-w-2xl text-base text-gray-500 leading-relaxed">{subtitle}</p>
        )}
    </div>
);
