"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@/components/misc/Icons";

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export const SearchInput = ({ placeholder = "Search cases...", value, onChange }: SearchInputProps) => {
    const [internalValue, setInternalValue] = useState("");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (next: string) => {
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
    };

    return (
        <div className="relative w-72">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </span>
            <input
                type="text"
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
            />
        </div>
    );
};
