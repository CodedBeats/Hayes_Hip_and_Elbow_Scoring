// components
import { SearchInput } from "@/components/admin/SearchInput";


interface AdminTopBarProps {
    title: string;
    subtitle: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

export const AdminTopBar = ({ title, subtitle, searchValue, onSearchChange }: AdminTopBarProps) => {
    return (
        <div className="flex items-start justify-between gap-6">
            <div>
                <h2 className="text-2xl font-bold text-brand-brown">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>
            <SearchInput value={searchValue} onChange={onSearchChange} />
        </div>
    );
};
