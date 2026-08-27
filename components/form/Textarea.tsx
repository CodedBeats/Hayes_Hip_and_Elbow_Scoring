
interface TextareaProps {
    label: string;
    name: string;
    placeholder?: string;
    rows?: number;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const Textarea = ({
    label,
    name,
    placeholder,
    rows = 5,
    value,
    onChange,
}: TextareaProps) => {
    return (
        <div className="mb-4 w-full">
            <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </label>
            <textarea
                id={name}
                name={name}
                placeholder={placeholder}
                rows={rows}
                required={true}
                value={value}
                onChange={onChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#506147] focus:ring-2 focus:ring-[#506147]/20 transition"
            />
        </div>
    );
};
