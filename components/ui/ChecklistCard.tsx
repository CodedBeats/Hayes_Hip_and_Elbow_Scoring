import { ChecklistItem } from "@/components/ui/ChecklistItem";

interface ChecklistCardProps {
    items: string[];
    columns?: 1 | 2;
    className?: string;
}

export const ChecklistCard = ({ items, columns = 2, className = "" }: ChecklistCardProps) => (
    <div
        className={[
            "mx-auto grid w-full max-w-3xl gap-x-10 gap-y-4 rounded-2xl border-2 border-brand-green-mid/20 bg-white p-8",
            columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
            className,
        ].join(" ")}
    >
        {items.map((item) => (
            <ChecklistItem key={item}>{item}</ChecklistItem>
        ))}
    </div>
);
