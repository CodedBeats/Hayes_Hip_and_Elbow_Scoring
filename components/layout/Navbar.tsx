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
        <nav className="flex items-center justify-between px-10 py-5 bg-white shadow-sm font-[var(--font-plus-jakarta-sans)]">
            <span className="text-2xl font-bold tracking-tight text-[#506147]">
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
                                    ? 'text-[#7A8C70] border-[#7A8C70] -translate-y-0.5'
                                    : 'text-gray-500 border-transparent hover:text-[#7A8C70] hover:border-[#7A8C70] hover:-translate-y-0.5',
                            ].join(' ')}
                        >
                            {label}
                        </Link>
                    );
                })}

                <Link
                    href="/admin"
                    className="px-5 py-2 rounded-md bg-[#7A8C70] text-white text-sm font-semibold hover:bg-[#6a7b61] transition-colors duration-200"
                >
                    Admin Login
                </Link>
            </div>
        </nav>
    );
};
