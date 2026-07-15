// dependencies
import Link from "next/link";
//components
import { ImageTextSection } from "@/components/ui/ImageTextSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CredentialChip } from "@/components/ui/CredentialChip";
import { Pill } from "@/components/ui/Pill";
import { ChecklistItem } from "@/components/ui/ChecklistItem";
import { Accordion } from "@/components/ui/Accordion";
import { PricingCard } from "@/components/about/PricingCard";
import { ContactForm } from "@/components/about/ContactForm";
import {
    ClipboardIcon,
    ScanIcon,
    ShieldCheckIcon,
    DogIcon,
    ScaleIcon,
    EnvelopeIcon,
    ArrowUpRightIcon,
} from "@/components/misc/Icons";
// types
import type { ExamType } from "@/types/form";
// lib
import { EXAM_LABELS, calculatePrice } from "@/lib/pricing";

const credentialChips = [
    { icon: <ClipboardIcon className="w-4 h-4 text-brand-green" />, label: "Uni Melb Graduate" },
    { icon: <ScanIcon className="w-4 h-4 text-brand-green" />, label: "Master of Radiology" },
    { icon: <ShieldCheckIcon className="w-4 h-4 text-brand-green" />, label: "CHED Panellist" },
    { icon: <DogIcon className="w-4 h-4 text-brand-green" />, label: "Dogs Australia" },
    { icon: <ScaleIcon className="w-4 h-4 text-brand-green" />, label: "30+ Years Exp." },
];

const standardsChecklist = [
    "Radiographs are assessed using the Dogs Australia (ANKC) Canine Hip and Elbow Dysplasia Scheme requirements.",
    "Submissions should be provided in DICOM format and must meet radiographic positioning standards to ensure accurate assessment.",
    "All assessments are performed in accordance with recognised Australian canine hip and elbow scoring protocols.",
];

const positioningItems = [
    {
        id: "hips",
        title: "Hip Positioning Guide",
        content: (
            <ImageTextSection
                image={{ src: "/images/Hips example.jpg", alt: "Example hip radiograph" }}
                imagePosition="left"
                className="!max-w-none !gap-6 !px-0 !py-0"
            >
                <p className="text-sm text-gray-600 leading-relaxed">
                    A single extended VD view of the pelvis is required for scoring, taken under general
                    anaesthetic or heavy sedation, to enable correct positioning. The dog is positioned in dorsal
                    recumbency and the hind limbs extended caudally. The image should include the wings of the
                    ilia cranially, and if possible, include the stifles (if the size of the dog allows). Priority
                    should be given to including the wings of the ilia rather than the stifles if the dog is too
                    large. The x-ray beam is centred over the hips, this can be achieved by palpating bony
                    landmarks such as the cranial edge of the pubic symphysis, and the greater trochanters. The
                    femurs are held parallel by rotating the limbs medially, so that the patellas are superimposed
                    over the distal femurs, and adducting the limbs. It is important that there is no tilting or
                    rotation of the pelvis, as this can make one hip look better and the other look worse than it
                    actually is, affecting the scoring. This can be assessed by checking the wings of the ilia,
                    which should look identical; if there is tilting, one iliac wing will look wider than the
                    other, the wider one being tilted down. Also, the obturator foramina should look identical. A
                    well-positioned pelvis looks symmetrical.
                </p>
            </ImageTextSection>
        ),
    },
    {
        id: "elbows",
        title: "Elbow Positioning Guide",
        content: (
            <ImageTextSection
                image={{ src: "/images/Elbow example.jpg", alt: "Example elbow radiograph" }}
                imagePosition="left"
                className="!max-w-none !gap-6 !px-0 !py-0"
            >
                <p className="text-sm text-gray-600 leading-relaxed">
                    A single, fully flexed, medial to lateral view of each elbow is required, labelled L and R.
                    This allows clear visualisation of the anconeal process, to check for any evidence of
                    osteophyte formation. With the dog in lateral recumbency, the elbow to be radiographed is
                    pulled away from the body, to prevent superimposition of the sternum, and then completely
                    flexed. The chest is rolled away from the elbow, and the upper forelimb is pulled caudally.
                    The x-ray beam is centred on the elbow joint, this can be achieved by palpating the humeral
                    condyles and using them as landmarks for centring the beam.
                </p>
            </ImageTextSection>
        ),
    },
];

const faqItems = [
    {
        id: "turnaround",
        title: "How long does assessment take?",
        content: "Most submissions are reviewed as quickly as possible following receipt of complete radiographs and payment.",
    },
    {
        id: "dicom",
        title: "Why DICOM instead of JPEG?",
        content: "DICOM files contain raw diagnostic data allowing for precise adjustments and measurements that static JPEG images cannot provide.",
    },
    {
        id: "own-photos",
        title: "Can I submit my own photos?",
        content: "No. All radiographs must be taken by a registered veterinarian under professional clinical conditions to ensure correct positioning and patient safety.",
    },
    {
        id: "rescoring",
        title: "Is rescoring possible?",
        content: "Rescoring is governed by Dogs Australia protocols. If positioning is suboptimal, a reshoot may be requested before a score is issued.",
    },
    {
        id: "before-submitting",
        title: "What information do I need before submitting?",
        content: "You'll need dog details, owner details, veterinary clinic information, and DICOM files for the relevant exam type (hips, elbows, or both).",
    },
    {
        id: "payment",
        title: "How do I pay for a submission?",
        content: "Payment is processed securely at the time of submission. Current pricing for each exam type is listed above in Scoring Fees.",
    },
    {
        id: "refunds",
        title: "Can I get a refund if I change my mind?",
        content: (
            <>
                Refunds are not offered for completed submissions. If you believe a score is incorrect, see our{" "}
                <Link href="/misc/appeals" className="font-semibold text-brand-green underline">
                    Appeals process
                </Link>
                .
            </>
        ),
    },
    {
        id: "appeals",
        title: "How do I appeal a score?",
        content: (
            <>
                The appeals process is handled entirely by Dogs Australia (ANKC) - we&apos;re not involved in it.
                Our{" "}
                <Link href="/misc/appeals" className="font-semibold text-brand-green underline">
                    Appeals Process
                </Link>{" "}
                page has the fee schedule plus links to Dogs Australia&apos;s official appeal information.
            </>
        ),
    },
    {
        id: "who-can-submit",
        title: "Who can submit radiographs for scoring?",
        content: "Any registered veterinarian, breeder, or owner may submit, provided the radiographs were taken by a registered vet under clinical conditions.",
    },
    {
        id: "clinics",
        title: "Can a clinic submit on behalf of multiple owners?",
        content: "Yes, clinics may submit multiple cases. Each submission still requires individual dog, owner and vet details.",
    },
];

const examTypes = Object.keys(EXAM_LABELS) as ExamType[];

const AboutPage = () => {
    return (
        <main className="flex flex-col bg-cream font-sans">
            <section className="px-6 pt-10 sm:px-10">
                <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-warm-sand to-cream px-6 py-14 sm:px-10">
                    <SectionHeading
                        eyebrow="MEET OUR EXPERT"
                        title="About Dr Ana Hayes"
                        subtitle="Experienced Dogs Australia CHED panellist providing professional canine hip and elbow scoring services."
                    />
                </div>
            </section>

            <ImageTextSection
                image={{ src: "/images/Ana and pup.jpeg", alt: "Dr Ana Hayes with a puppy" }}
                imagePosition="left"
                overlayBadge={
                    <div className="bg-green-200 rounded-full">
                        <Pill>CHED Panellist for Dogs Australia</Pill>
                    </div>
                }
            >
                <h2 className="text-3xl font-bold text-brand-brown">Dr Ana Hayes</h2>
                <div className="flex flex-col gap-1.5 text-sm font-medium text-brand-brown">
                    <span className="flex items-center gap-2">
                        <ClipboardIcon className="w-4 h-4 text-brand-green-mid" /> Bachelor of Veterinary Science (Honours)
                    </span>
                    <span className="flex items-center gap-2">
                        <ScanIcon className="w-4 h-4 text-brand-green-mid" /> Master of Veterinary Studies (Radiology)
                    </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Ana graduated from the University of Melbourne in 1983 and initially worked in small animal
                    practice before returning to the University of Melbourne Teaching Hospital in Werribee.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    During this time she completed an internship in Radiology and Small Animal Medicine under the
                    supervision of Dr Roger Lavelle.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    She obtained her Master of Veterinary Studies (Radiology) in 1987. Since 1990 she has provided
                    radiology services in small animal practice in Melbourne&apos;s eastern suburbs.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Following extensive training in the Dogs Australia hip and elbow scoring system by Dr Roger
                    Lavelle, Ana was invited to join the CHED panel in 2019 and has since provided official
                    scoring services for Dogs Australia.
                </p>
            </ImageTextSection>

            <div className="mx-auto -mt-6 mb-16 flex w-full max-w-6xl flex-wrap justify-center gap-4 px-6 sm:px-10">
                {credentialChips.map(({ icon, label }) => (
                    <CredentialChip key={label} icon={icon} label={label} />
                ))}
            </div>

            <ImageTextSection
                image={{ src: "/images/Ana and Golden Retriever 1.jpeg", alt: "Dr Ana Hayes with a Golden Retriever" }}
                imagePosition="right"
            >
                <h2 className="text-3xl font-bold text-brand-brown">Standards and Compliance</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                    We operate in strict adherence to the Dogs Australia (ANKC) Canine Hip and Elbow Dysplasia
                    (CHED) requirements. Accuracy in scoring starts with the quality of the submission.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                    {standardsChecklist.map((item) => (
                        <ChecklistItem key={item}>{item}</ChecklistItem>
                    ))}
                </div>
            </ImageTextSection>

            <section id="ched-resources" className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-6 py-16 text-center sm:px-10">
                <SectionHeading
                    title="Official CHED Resources"
                    subtitle="ORCHID is the official Dogs Australia portal for the Canine Hip and Elbow Dysplasia (CHED) scheme - it's where you'll find all official scheme information and submission forms."
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                        href="https://orchid.ankc.org.au/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-warm-sand px-4 py-3 text-sm font-medium text-brand-green hover:underline"
                    >
                        <ArrowUpRightIcon />
                        Visit the ORCHID Website
                    </a>
                    <a
                        href="https://orchid.ankc.org.au/Home/HomeChed"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-warm-sand px-4 py-3 text-sm font-medium text-brand-green hover:underline"
                    >
                        <ArrowUpRightIcon />
                        Visit the CHED Home Page
                    </a>
                </div>
            </section>

            <section id="positioning" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 sm:px-10">
                <SectionHeading
                    title="Radiographic Positioning Guide"
                    subtitle="Technical requirements for veterinary clinics and technicians."
                />
                <Accordion items={positioningItems} />
            </section>

            {/* pricing */}
            <section id="pricing" className="bg-warm-sand py-16">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 sm:px-10">
                    <SectionHeading title="Scoring Fees" subtitle="Current pricing per exam type, plus the applicable Dogs Australia levy." />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {examTypes.map((examType) => {
                            const { base } = calculatePrice(examType, true);
                            const memberTotal = calculatePrice(examType, true).total;
                            const nonMemberTotal = calculatePrice(examType, false).total;
                            return (
                                <PricingCard
                                    key={examType}
                                    label={EXAM_LABELS[examType]}
                                    base={base}
                                    memberTotal={memberTotal}
                                    nonMemberTotal={nonMemberTotal}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 sm:px-10">
                <SectionHeading title="Frequently Asked Questions" />
                <Accordion items={faqItems} />
            </section>

            {/* contact form */}
            <section id="contact" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 sm:px-10">
                <SectionHeading title="Contact Dr Ana Hayes" subtitle="Have questions about the scoring process or technical requirements? Send a message directly to Ana Hayes." />
                <ContactForm />

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                    Email Support:{" "}
                    <a href="mailto:anahayes18@icloud.com" className="font-semibold text-brand-green underline">
                        anahayes18@icloud.com
                    </a>
                </div>

                <div className="rounded-2xl bg-warm-sand p-5 text-sm text-brand-brown">
                    <p className="font-semibold">Developer / Site Support</p>
                    <p className="mt-1 text-gray-600">
                        For technical issues with the website itself (not scoring enquiries), contact{" "}
                        <a href="mailto:luca.haar@icloud.com" className="font-semibold text-brand-green underline">
                            luca.haar@icloud.com
                        </a>
                        .
                    </p>
                </div>
            </section>
        </main>
    );
};

export default AboutPage;
