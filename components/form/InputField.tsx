// custom input with label and container

import { useState } from "react";

interface InputFieldProps {
    label: string;
    name: string;
    type: string;
    placeholder?: string;
    value?: string | boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputField = ({
    label,
    name,
    type,
    placeholder,
    value,
    onChange,
}: 
    InputFieldProps
) => {
    return (
        <div className="mb-4 w-full">
            <label className="block mb-2 text-sm font-medium text-black">
                {label}
            </label>

            <input
                type={type}
                name={name}
                placeholder={placeholder}
                required={true}
                value={type !== "checkbox" ? String(value ?? "") : undefined}
                checked={type === "checkbox" ? Boolean(value) : undefined}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
            />
        </div>
    );
}