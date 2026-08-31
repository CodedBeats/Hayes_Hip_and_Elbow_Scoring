"use client";
// dependencies
import Link from "next/link";
import { usePathname } from "next/navigation";
// components
import {
    Squares2x2Icon,
    ClipboardIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    BriefcaseIcon,
    PersonIcon,
    ArrowRightOnRectangleIcon,
} from "@/components/misc/Icons";


// constants for links
const navItems = [
    { label: "Overview", href: "/admin", icon: Squares2x2Icon },
    { label: "Pending Reviews", href: "/admin/pending-reviews", icon: ClipboardIcon },
    { label: "Archive", href: "/admin/archive", icon: ArchiveBoxIcon },
];
const navSupportItems = [
    // signing in redirects here, and this layout has no other link back to the public
    // site - this is how an admin gets back to /submit to use the "Admin Test Submit"
    // button without having to sign out first
    { label: "Test a Submission", href: "/submit", icon: BriefcaseIcon },
    { label: "Settings", href: "/admin/admin-settings", icon: Cog6ToothIcon },
];


interface SidebarProps {
    userEmail: string;
    onSignOut: () => void;
}

export const Sidebar = ({ userEmail, onSignOut }: SidebarProps) => {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 flex h-screen w-64 flex-shrink-0 flex-col justify-between border-r border-gray-200 bg-cream px-5 py-6">
            <div>
                <h1 className="px-2 text-xl font-bold text-brand-brown">Admin Dashboard</h1>

                <div className="mt-6 flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-green-mid/20 text-brand-green-mid">
                        <PersonIcon />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-brown">{userEmail}</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                </div>

                <nav className="mt-6 flex flex-col gap-1">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={[
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                                    isActive
                                        ? "bg-brand-green-mid text-white"
                                        : "text-gray-600 hover:bg-brand-green-mid/10 hover:text-brand-brown",
                                ].join(" ")}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-200 pt-4">
                
                
                {navSupportItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                                isActive
                                    ? "bg-brand-green-mid text-white"
                                    : "text-gray-600 hover:bg-brand-green-mid/10 hover:text-brand-brown",
                            ].join(" ")}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {label}
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={onSignOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 cursor-pointer transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
                >
                    <ArrowRightOnRectangleIcon />
                    Sign out
                </button>
            </div>
        </aside>
    );
};
