import Link from 'next/link';

const quickLinks = [
    { label: 'Submit Case', href: '/submit' },
    { label: 'Scoring Fees', href: '/about#pricing' }, // link to pricing in about page
    { label: 'Contact Us', href: '/about#contact' },// link to contact in about page
];

const resourceLinks = [
    { label: 'Privacy Policy', href: '/misc/privacy-policy' },
    { label: 'Terms of Service', href: '/misc/terms-of-service' },
    { label: 'Appeal Process', href: '/misc/appeals' }, 
    { label: 'FAQ', href: '/about#faq' }, //link to section of about page
];

export const Footer = () => {
    return (
        <footer className="bg-[#3E2B23] text-white font-[var(--font-plus-jakarta-sans)] mt-auto">
            {/* Main content row */}
            <div className="px-10 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

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

                {/* Column 3 - Resources */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold tracking-wide uppercase text-white/90">
                        Resources
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {resourceLinks.map(({ label, href }) => (
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
                        Contact Us
                    </h3>
                    <div className="flex flex-col gap-4">
                        <a
                            href="mailto:anahayes18@icloud.com"
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                                </svg>
                            </span>
                            anahayes18@icloud.com
                        </a>

                        <a
                            href="tel:+61400874741"
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                            </span>
                            +61 400 874 741
                        </a>
                    </div>
                </div>
            </div>

            {/* Divider + copyright */}
            <div className="border-t border-white/10 px-10 py-5">
                <p className="text-xs text-white/40 text-center">
                    &copy; 2026 Hayes Hip &amp; Elbow Scoring. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
