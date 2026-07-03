import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface RequirementCardProps {
    image: { src: string; alt: string };
    title: string;
    items: string[];
    note?: string;
    ctaLabel?: string;
    ctaHref?: string;
}

export const RequirementCard = ({ image, title, items, note, ctaLabel, ctaHref }: RequirementCardProps) => (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
        <div className="relative h-56 w-full">
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
        </div>
        <div className="flex flex-col gap-3 p-6">
            <h3 className="text-lg font-bold text-brand-brown">{title}</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-gray-600">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-green-mid" />
                        {item}
                    </li>
                ))}
            </ul>
            {note && <p className="text-xs font-medium text-red-600">{note}</p>}
            {ctaLabel && ctaHref && (
                <Button href={ctaHref} variant="outline" className="mt-2 self-start !border-brand-green-mid !text-brand-green hover:!bg-warm-sand">
                    {ctaLabel}
                </Button>
            )}
        </div>
    </div>
);
