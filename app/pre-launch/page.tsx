import Image from 'next/image';
import Link from 'next/link';

const highlights = [
    {
        title: 'Secure DICOM Uploads',
        description:
            'Submissions retain full-resolution, readable DICOM files through our encrypted digital pipeline - no quality loss from compression.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
    },
    {
        title: 'Multi-faceted Submissions',
        description:
            'Submit radiographs, ownership documents, breeder details and clinical notes together in one streamlined, guided submission flow.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
    {
        title: 'Case Tracking',
        description:
            'Real-time status updates on every submission so breeders and clinicians always know exactly where their case sits in the review queue.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
    },
];

const PreLaunchPage = () => {
    return (
        <main className="font-(--font-plus-jakarta-sans) bg-white">
            {/* ── Header ────────────────────────────────────────────────── */}
            <section className="py-10 px-10 bg-[#F9F7F3]">
                <div className="text-center flex flex-col justify-center gap-5">
                    <h1 className="text-5xl lg:text-6xl font-bold text-brand-green text-center w-full">
                        Hayes Hip & Elbow Scoring
                    </h1>
                </div>
            </section>

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-10 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-5">
                    <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-brand-green-mid/15 text-brand-green text-xs font-semibold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                        Coming Soon
                    </span>

                    <h1 className="text-3xl lg:text-4xl font-bold text-brand-brown leading-tight">
                        Professional assessment of canine hip and elbow radiographs by Dr Ana Hayes
                    </h1>

                    <p className="text-xl lg:text-2xl font-bold text-brand-green leading-relaxed max-w-lg">
                        BVSc (Hons), MVS (Radiology), CHED panellist
                    </p>

                    <p className="text-base text-gray-500 leading-relaxed max-w-lg">
                        Submit DICOM radiographs for hip and elbow scoring in accordance with Dogs Australia
                        requirements. Fast, professional assessment from an experienced CHED panellist.
                    </p>

                    <Link
                        href="#construction"
                        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-green hover:gap-3 transition-all duration-200"
                    >
                        Launching in 4 Weeks
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>

                    <Link
                        href="/pre-launch/dev-login"
                        className="text-xs text-gray-400 hover:text-gray-500 hover:underline self-start"
                    >
                        Internal Preview
                    </Link>
                </div>

                <div className="relative h-[420px] lg:h-[480px] rounded-2xl overflow-hidden shadow-xl">
                    <Image
                        src="/images/Ana and Golden Retriever 2.jpeg"
                        alt="Dr Ana Hayes with a dog"
                        fill
                        className="object-cover object-top"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/20 to-transparent" />
                </div>
            </section>

            {/* ── Contact & Links ──────────────────────────────── */}
            <section className="px-6 sm:px-10 lg:px-24 py-10 bg-warm-sand border-t border-b border-[#C4C8BE]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Email & Phone */}
                    <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-xl bg-[#DDE8D5] text-brand-green flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </span>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-gray-900">anahayes18@icloud.com</p>
                            <p className="text-sm text-gray-500">(+61) 400 874 741</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center justify-start md:justify-center gap-4">
                        <span className="w-10 h-10 rounded-xl bg-[#DDE8D5] text-brand-green flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </span>
                        <div className="h-full flex justify-center items-center">
                            <p className="text-sm font-semibold text-gray-900">PO Box 36 Vermont VIC 3133</p>
                        </div>
                    </div>

                    {/* CHED Home Page */}
                    <div className="flex items-start justify-start md:justify-end gap-4">
                        <span className="w-10 h-10 rounded-xl bg-[#DDE8D5] text-brand-green flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </span>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-gray-900">CHED Scheme</p>
                            <a
                                href="https://orchid.ankc.org.au/Home/HomeChed"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand-green hover:underline"
                            >
                                Dogs Australia CHED Home
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Our Mission ──────────────────────────────────── */}
            <section className="py-20 px-10 bg-[#F9F7F3]">
                <div className="max-w-2xl mx-auto text-center flex flex-col gap-5">
                    <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                    <div className="w-10 h-0.5 bg-brand-green-mid mx-auto" />
                    <p className="text-base text-gray-500 leading-relaxed">
                        The mission is simple: give breeders direct, transparent access to the hip and elbow scoring
                        process. We&apos;ve built a streamlined submission and review platform online, committed to
                        maintaining the highest ethical standards while delivering the modern efficiency that today&apos;s
                        veterinary professionals and breeders deserve.
                    </p>
                </div>
            </section>

            {/* ── Platform Highlights ──────────────────────────── */}
            <section className="py-20 px-10 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col gap-10">
                    <h2 className="text-3xl font-bold text-gray-900 text-center">Platform Highlights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {highlights.map(({ title, description, icon }) => (
                            <div
                                key={title}
                                className="flex flex-col gap-4 p-7 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                            >
                                <span className="w-10 h-10 rounded-xl bg-[#F0EBE3] text-brand-green-mid flex items-center justify-center">
                                    {icon}
                                </span>
                                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Under Construction ───────────────────────────── */}
            <section id="construction" className="py-24 px-10 bg-[#F2E8D6]">
                <div className="max-w-xl mx-auto flex flex-col items-center gap-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#E0D4C0] flex items-center justify-center text-[#7A6650]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl font-bold text-gray-900">Under Construction</h2>
                        <p className="text-base text-gray-500 leading-relaxed">
                            Made for veterinarians, breeders and owners Australia-wide.<br />
                            We&apos;re still in development. 
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
                            <span>95% Complete</span>
                            <span className="text-brand-green">Almost there</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#E0D4C0] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-green-mid to-brand-green"
                                style={{ width: '95%' }}
                            />
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        1 Week Estimated Launch
                    </span>
                </div>
            </section>

        </main>
    );
};

export default PreLaunchPage;
