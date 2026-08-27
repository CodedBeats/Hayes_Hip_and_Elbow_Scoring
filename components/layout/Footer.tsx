// dependencies
import Link from 'next/link';
// components
import { EnvelopeIcon, PhoneIcon, ReceiptIcon } from '../misc/Icons';


// constants for links
const quickLinks = [
    { label: 'Submit Case', href: '/submit' },
    { label: 'Scoring Fees', href: '/about#pricing' }, // link to pricing in about page
    { label: 'Contact Us', href: '/about#contact' },// link to contact in about page
];
const legalLinks = [
    { label: 'Privacy Policy', href: '/misc/privacy-policy' },
    { label: 'Terms of Service', href: '/misc/terms-of-service' },
    { label: 'Appeal Process', href: '/misc/appeals' },
    { label: 'FAQ', href: '/about#faq' }, //link to section of about page
];


export const Footer = () => {
    return (
        <footer className="bg-[#3E2B23] text-white font-[var(--font-plus-jakarta-sans)] mt-auto">
            {/* Main content row */}
            <div className="px-6 sm:px-10 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_2fr] gap-10 md:gap-15">

                {/* Column 1 - About blurb */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold tracking-wide uppercase text-white/90">
                        Hayes Hip & Elbow
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                        A dedicated scoring platform for veterinary hip and elbow assessments,
                        supporting breeders and clinicians with reliable, standardised results.
                    </p>
                </div>

                {/* Column 2 - Quick links */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold tracking-wide uppercase text-white/90">
                        Quick Links
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {quickLinks.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3 - Legal */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold tracking-wide uppercase text-white/90">
                        Legal
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {legalLinks.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4 - Contact */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold tracking-wide uppercase text-white/90">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-4">
                        <a
                            href="mailto:anahayes18@icloud.com"
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200 flex items-center justify-center">
                                <EnvelopeIcon className="w-4 h-4" />
                            </span>
                            anahayes18@icloud.com
                        </a>

                        <a
                            href="tel:+61400874741"
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200 flex items-center justify-center">
                                <PhoneIcon className="w-4 h-4" />
                            </span>
                            +61 400 874 741
                        </a>

                        <a
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200 flex items-center justify-center">
                                <ReceiptIcon className="w-4 h-4" />
                            </span>
                            ABN - 15103947705
                        </a>
                    </div>
                </div>
            </div>

            {/* Divider + copyright */}
            <div className="border-t border-white/10 px-6 sm:px-10 py-4 sm:py-5">
                <p className="text-xs text-white/40 text-center">
                    &copy; 2026 Hayes Hip &amp; Elbow Scoring. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
