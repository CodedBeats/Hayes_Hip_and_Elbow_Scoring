// dependencies
"use client";
import { useRouter } from "next/navigation";
//components
import { ImageCTASection } from "@/components/ui/ImageCTASection";
import { ImageTextSection } from "@/components/ui/ImageTextSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepCard } from "@/components/ui/StepCard";
import { RequirementCard } from "@/components/ui/RequirementCard";
import { ChecklistCard } from "@/components/ui/ChecklistCard";
import { CredentialChip } from "@/components/ui/CredentialChip";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import {
    ScanIcon,
    CloudIcon,
    ClipboardIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ArrowUpRightIcon,
} from "@/components/misc/Icons";

const steps = [
    {
        icon: <ScanIcon className="w-6 h-6 text-brand-green-mid" />,
        title: "Take Radiographs",
        description: "Your veterinarian captures the required hip and elbow images using the correct positioning protocol.",
    },
    {
        icon: <CloudIcon className="w-6 h-6 text-brand-green-mid" />,
        title: "Export DICOM Files",
        description: "Radiographs must be supplied in DICOM format to ensure image quality and diagnostic accuracy.",
    },
    {
        icon: <ClipboardIcon className="w-6 h-6 text-brand-green-mid" />,
        title: "Submit Online",
        description: "Upload your DICOM files together with patient and owner information through the submission form.",
    },
    {
        icon: <MagnifyingGlassIcon className="w-6 h-6 text-brand-green-mid" />,
        title: "Assessment",
        description: "Dr Ana Hayes reviews the radiographs and performs official scoring.",
    },
    {
        icon: <ShieldCheckIcon className="w-6 h-6 text-brand-green-mid" />,
        title: "Results Returned",
        description: "Results are processed and returned following assessment.",
    },
];

const hipRequirements = [
    "General anaesthesia or heavy sedation required",
    "Hind limbs extended caudally",
    "Pelvis positioned symmetrically",
    "Iliac wings visible",
    "Beam centred over hips",
    "Patellae positioned centrally",
];

const elbowRequirements = [
    "Left and right elbows labelled",
    "Elbow fully flexed",
    "Beam centred on elbow joint",
    "Positioning should allow clear visualisation of the anconeal process",
];

const beforeYouSubmit = [
    "DICOM files ready",
    "Hip radiograph correctly positioned",
    "Elbow radiographs correctly positioned",
    "Payment method ready",
    "Dog details available",
    "Owner details available",
    "Veterinary clinic information available",
];

const chipClassName = "inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-brand-brown";

const Home = () => {
    const router = useRouter();

    const handleExitPreview = async () => {
        await fetch("/api/dev-login", { method: "DELETE" });
        router.push("/pre-launch");
    };

    return (
        <main className="flex flex-col bg-cream font-sans">
            <ImageCTASection
                image={{ src: "/images/Golden Retriever.png", alt: "Golden Retriever" }}
                title="Professional assessment of canine hip and elbow radiographs by Dr Ana Hayes"
                subtitle="Submit DICOM radiographs for hip and elbow scoring in accordance with Dogs Australia requirements."
                minHeightClassName="min-h-[560px] sm:min-h-[640px]"
            >
                <Button href="/submit" variant="solid">Start Submission</Button>
                <Button href="/about" variant="outline">Learn More</Button>
            </ImageCTASection>

            <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
                <h2 className="text-xl font-bold text-brand-brown">Looking for official CHED information?</h2>
                <p className="max-w-2xl text-sm text-gray-600 leading-relaxed">
                    ORCHID is the official Dogs Australia portal for the Canine Hip and Elbow Dysplasia (CHED)
                    scheme, including scheme details and submission forms.
                </p>
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

            <ImageTextSection image={{ src: "/images/Ana portrait.jpg", alt: "Dr Ana Hayes" }} imagePosition="left">
                <div>
                    <h2 className="text-3xl font-bold text-brand-brown">Meet Dr Ana Hayes</h2>
                    <p className="text-lg lg:text-xl font-bold text-brand-green leading-relaxed max-w-lg">
                        BVSc (Hons), MVS (Radiology)
                    </p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Dr Ana Hayes graduated from the University of Melbourne in 1983 and completed a two year internship in Radiology and Small Animal Medicine at the University of Melbourne Teaching Hospital in Werribee.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    She obtained her Master of Veterinary Studies (Radiology) in 1987 and has provided radiology
                    services in small animal practice for more than three decades.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    In 2019, Dr Hayes joined the CHED Panel for Dogs Australia after being invited by Dr Roger
                    Lavelle, one of the developers of the canine hip and elbow scoring system used throughout
                    Australia.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Today she continues to provide official hip and elbow scoring services for Dogs Australia
                    breeders, owners and veterinarians.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                    <CredentialChip icon={<CheckCircleIcon className="w-4 h-4 text-brand-green" />} label="Bachelor of Veterinary Science (Hons)" />
                    <CredentialChip icon={<CheckCircleIcon className="w-4 h-4 text-brand-green" />} label="Master of Veterinary Studies (Radiology)" />
                </div>
                <div className="flex flex-wrap gap-3">
                    <Pill className={chipClassName}>CHED Panellist</Pill>
                    <Pill className={chipClassName}>Dogs Australia</Pill>
                </div>
            </ImageTextSection>

            <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 sm:px-10">
                <SectionHeading
                    title="How Scoring Works"
                    subtitle="Our streamlined digital process ensures accurate results with a professional turnaround."
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {steps.map((step, index) => (
                        <StepCard key={step.title} step={index + 1} icon={step.icon} title={step.title} description={step.description} />
                    ))}
                </div>
            </section>

            <ImageTextSection image={{ src: "/images/Ana reading xrays.jpg", alt: "Dr Ana Hayes reviewing radiographs" }} imagePosition="left">
                <h2 className="text-3xl font-bold text-brand-brown">Why DICOM Files Are Required</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                    DICOM is the international standard format used for medical imaging. Unlike screenshots, JPEGs
                    or exported images, DICOM files preserve the original diagnostic image quality, metadata and
                    exposure information required for accurate assessment.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    For reliable hip and elbow scoring, submissions should always include the original DICOM files
                    generated by your imaging system.
                </p>
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                    Standard Image Formats (JPG, PNG) are not acceptable for scoring.
                </div>
            </ImageTextSection>

            <section className="bg-warm-sand py-16">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:px-10">
                    <SectionHeading title="Radiograph Requirements" />
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <RequirementCard
                            image={{ src: "/images/Hips example.jpg", alt: "Example hip radiograph" }}
                            title="Hip Positioning Requirements"
                            items={hipRequirements}
                            note="Poor positioning may affect scoring accuracy."
                            ctaLabel="View Full Requirements"
                            ctaHref="/about#positioning"
                        />
                        <RequirementCard
                            image={{ src: "/images/Elbow example.jpg", alt: "Example elbow radiograph" }}
                            title="Elbow Positioning Requirements"
                            items={elbowRequirements}
                            ctaLabel="View Full Requirements"
                            ctaHref="/about#positioning"
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-16 sm:px-10">
                <SectionHeading title="Before You Submit" />
                <ChecklistCard items={beforeYouSubmit} columns={2} />
            </section>

            <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-16 sm:px-10">
                <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Preview Mode
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                You are currently viewing the application in preview mode.
                            </p>
                        </div>

                        <button
                            onClick={handleExitPreview}
                            className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3d4e36]"
                        >
                            Exit Preview
                        </button>
                    </div>
                </div>
            </section>

            <ImageCTASection
                image={{ src: "/images/Ana and Golden Retriever 2.jpeg", alt: "Dr Ana Hayes with a Golden Retriever" }}
                title="Ready to Submit?"
                subtitle="Upload your radiographs and submit your assessment request online."
                align="center"
                minHeightClassName="min-h-[560px] sm:min-h-[700px]"
            >
                <Button href="/submit" variant="solid">Start Submission</Button>
            </ImageCTASection>
        </main>
    );
};

export default Home;
