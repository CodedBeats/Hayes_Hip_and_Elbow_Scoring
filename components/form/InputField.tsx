// custom input with label and container

interface InputFieldProps {
    label: string;
    name: string;
    type: string;
    placeholder?: string;
    value?: string | boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string;
}

export const InputField = ({
    label,
    name,
    type,
    placeholder,
    value,
    onChange,
    autoComplete = "off",
}: InputFieldProps) => {
    if (type === "checkbox") {
        return (
            <div className="mb-4 flex items-center gap-2">
                <input
                    id={name}
                    type="checkbox"
                    name={name}
                    checked={Boolean(value)}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-gray-300 accent-[#506147]"
                />
                <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
            </div>
        );
    }

    return (
        <div className="mb-4 w-full">
            <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                id={name}
                type={type}
                name={name}
                placeholder={placeholder}
                required={true}
                value={String(value ?? "")}
                onChange={onChange}
                autoComplete={autoComplete}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
            />
        </div>
    );
}
