"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/misc/Icons";

interface AccordionItemData {
    id: string;
    title: string;
    content: React.ReactNode;
}

interface AccordionProps {
    items: AccordionItemData[];
    className?: string;
}

export const Accordion = ({ items, className = "" }: AccordionProps) => {
    const [openId, setOpenId] = useState<string | null>(null);

    return (
        <div className={["flex w-full flex-col gap-3", className].join(" ")}>
            {items.map(({ id, title, content }) => {
                const isOpen = openId === id;
                return (
                    <div key={id} className="overflow-hidden rounded-2xl border-2 border-brand-green-mid/20 bg-white">
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : id)}
                            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                        >
                            <span className="text-base font-semibold text-brand-brown">{title}</span>
                            <ChevronDownIcon
                                className={[
                                    "w-5 h-5 text-brand-brown flex-shrink-0 transition-transform duration-200",
                                    isOpen ? "rotate-180" : "",
                                ].join(" ")}
                            />
                        </button>
                        {isOpen && <div className="px-6 pb-6 text-brand-brown">{content}</div>}
                    </div>
                );
            })}
        </div>
    );
};
