'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Submit', href: '/submit' },
];

export const Navbar = () => {
    const pathname = usePathname();

    return (
        <nav className="flex items-center justify-between px-10 py-5 bg-white shadow-sm font-(--font-plus-jakarta-sans)">
            <span className="text-2xl font-bold tracking-tight text-brand-green">
                Hayes Hip & Elbow Scoring
            </span>

            <div className="flex items-center gap-8">
                {navItems.map(({ label, href }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                'relative text-sm font-semibold pb-1 border-b-2 transition-all duration-200',
                                isActive
                                    ? 'text-brand-green-mid border-brand-green-mid -translate-y-0.5'
                                    : 'text-gray-500 border-transparent hover:text-brand-green-mid hover:border-brand-green-mid hover:-translate-y-0.5',
                            ].join(' ')}
                        >
                            {label}
                        </Link>
                    );
                })}

                <Link href="/auth/sign-in">
                    <button
                        type="button"
                        className="px-5 py-2 rounded-md bg-brand-green-mid text-white text-sm font-semibold cursor-pointer hover:bg-[#6a7b61] transition-colors duration-200"
                    >
                        Admin Login
                    </button>
                </Link>
            </div>
        </nav>
    );
};
