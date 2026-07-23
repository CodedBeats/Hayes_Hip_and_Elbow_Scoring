'use client';
// dependencies
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
// components
import { Bars3Icon, XMarkIcon } from '@/components/misc/Icons';


// constants for nav links
const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Submit', href: '/submit' },
];


export const Navbar = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(false);
    }, [pathname]);

    return (
        <nav className="relative flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 md:py-5 bg-white shadow-sm font-(--font-plus-jakarta-sans)">
            <span className="min-w-0 truncate text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-brand-green">
                Hayes Hip & Elbow Scoring
            </span>

            <div className="hidden md:flex items-center gap-8">
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

            <button
                type="button"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="md:hidden flex flex-shrink-0 items-center justify-center p-2 text-brand-brown"
            >
                {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 flex w-full flex-col gap-1 border-t border-gray-100 bg-white px-4 py-4 shadow-md md:hidden">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={[
                                    'rounded-md px-3 py-2.5 text-base font-semibold transition-colors duration-200',
                                    isActive
                                        ? 'text-brand-green-mid bg-warm-sand'
                                        : 'text-gray-500 hover:text-brand-green-mid',
                                ].join(' ')}
                            >
                                {label}
                            </Link>
                        );
                    })}

                    <Link href="/auth/sign-in" className="mt-2">
                        <button
                            type="button"
                            className="w-full px-5 py-2.5 rounded-md bg-brand-green-mid text-white text-sm font-semibold cursor-pointer hover:bg-[#6a7b61] transition-colors duration-200"
                        >
                            Admin Login
                        </button>
                    </Link>
                </div>
            )}
        </nav>
    );
};
