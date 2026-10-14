// dependencies
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
    <section
        className={[
            "mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2",
            className,
        ].join(" ")}
    >
        <div
            className={[
                "flex w-full",
                // image hugs the edge nearest the text column
                imagePosition === "right" ? "lg:order-2 lg:justify-center" : "lg:order-1 lg:justify-center",
            ].join(" ")}
        >
            {/* inner box shrink-wraps the rendered image so the overlay badge anchors to the image edge, not the letterboxed container */}
            <div className="relative h-[320px] w-fit max-w-full overflow-hidden rounded-2xl sm:h-[500px]">
                <Image
                    src={image.src}
                    alt={image.alt}
                    width={0}
                    height={0}
                    sizes="(min-width: 1024px) 600px, 100vw"
                    className="h-full w-auto max-w-full object-contain"
                />
                {overlayBadge && (
                    <div className="absolute bottom-4 left-4">{overlayBadge}</div>
                )}
            </div>
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
