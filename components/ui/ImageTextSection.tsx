import Image from "next/image";

interface ImageTextSectionProps {
    image: { src: string; alt: string };
    imagePosition?: "left" | "right";
    overlayBadge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ImageTextSection = ({
    image,
    imagePosition = "left",
    overlayBadge,
    children,
    className = "",
}: ImageTextSectionProps) => (
    <section className={["mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2", className].join(" ")}>
        <div
            className={[
                "relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[500px]",
                imagePosition === "right" ? "lg:order-2" : "lg:order-1",
            ].join(" ")}
        >
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
            {overlayBadge && (
                <div className="absolute bottom-4 left-4">{overlayBadge}</div>
            )}
        </div>
        <div
            className={[
                "flex flex-col gap-4",
                imagePosition === "right" ? "lg:order-1" : "lg:order-2",
            ].join(" ")}
        >
            {children}
        </div>
    </section>
);
