// dependencies
import Image from "next/image";

interface ImageCTASectionProps {
    image: { src: string; alt: string };
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    minHeightClassName?: string;
    children?: React.ReactNode;
    className?: string;
}

export const ImageCTASection = ({
    image,
    title,
    subtitle,
    align = "left",
    minHeightClassName = "min-h-[660px]",
    children,
    className = "",
}: ImageCTASectionProps) => (
    <section className={["relative w-full overflow-hidden", minHeightClassName, className].join(" ")}>
        <Image src={image.src} alt={image.alt} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/80 via-brand-brown/50 to-transparent" />
        <div
            className={[
                "relative z-10 flex h-full max-w-8xl flex-col justify-center gap-5 px-6 py-16 sm:px-10",
                align === "center" ? "items-center text-center" : "items-start text-left max-w-4xl",
            ].join(" ")}
        >
            <h1 className="text-3xl font-bold text-white leading-tight sm:text-4xl lg:text-5xl">
                {title}
            </h1>
            {subtitle && (
                <p className="max-w-xl text-base text-white/85 leading-relaxed">{subtitle}</p>
            )}
            {children && <div className="flex flex-wrap gap-4 pt-2">{children}</div>}
        </div>
    </section>
);
