import Link from "next/link";
import { PolicySection } from "@/components/misc/PolicySection";
import { DogIcon, ClipboardIcon, ScaleIcon, ScanIcon } from "@/components/misc/Icons";

const TermsOfServicePage = () => {
    return (
        <div className="flex flex-col flex-1 items-center bg-cream font-sans">
            <main className="flex flex-1 w-full max-w-6xl flex-col py-10 px-6 sm:px-10">
                <div className="mb-6 flex flex-col gap-2 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-brand-brown sm:text-4xl">Terms of Service</h1>
                    <p className="text-sm text-gray-500">Last updated: July 2026</p>
                </div>

                <div className="flex flex-col rounded-2xl border-2 border-brand-green-mid/20 bg-white p-6 sm:p-10">
                    <PolicySection icon={<DogIcon className="w-7 h-7 text-brand-green" />} title="Overview">
                        <p>
                            Hayes Hip &amp; Elbow Scoring provides paid, professional scoring of canine hip and
                            elbow radiographs for breeders, owners & clinics. This is a scoring opinion service - it
                            isn&apos;t a veterinary diagnosis or treatment, and it doesn&apos;t replace advice from
                            your vet.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ClipboardIcon className="w-7 h-7 text-brand-green" />} title="Submission Process">
                        <p>
                            To submit, you&apos;ll upload your dog&apos;s radiographs, provide owner and vet and dog
                            details, and pay the applicable fee. Submissions are reviewed and scored
                            by a qualified scorer.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScaleIcon />} title="Payment">
                        <p>
                            For regular use, fees are due at the time of submission and processed securely through Stripe. Current
                            pricing is listed on our scoring fees page. Clinic pricing is coming soon.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScanIcon className="w-7 h-7 text-brand-green" />} title="Scoring & Turnaround">
                        <p>
                            Scores reflect a professional opinion based on the imaging you submit. Turnaround times
                            are estimates, not guarantees, and the quality and positioning of your radiographs can
                            affect our ability to score them.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ClipboardIcon className="w-7 h-7 text-brand-green" />} title="Your Responsibilities">
                        <p>
                            You&apos;re responsible for providing accurate owner and dog information, and for
                            confirming that submitted radiographs meet our technical requirements. By submitting,
                            you confirm you have the right to do so on behalf of the dog&apos;s owner.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScaleIcon />} title="Appeals">
                        <p>
                            If you believe a score is incorrect, you can lodge a formal appeal. Appeal fees and the
                            process are outlined on our{" "}
                            <Link href="/misc/appeals" className="font-semibold text-brand-green underline">
                                Appeals Process
                            </Link>{" "}
                            page.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScaleIcon />} title="Liability & Changes">
                        <p>
                            Scoring opinions are provided in good faith and to the best professional judgement
                            available, but we can&apos;t guarantee any particular outcome. These terms may be
                            updated from time to time - continuing to use the service means you accept the current
                            version.
                        </p>
                    </PolicySection>
                </div>

                <div className="mt-6 rounded-2xl bg-warm-sand p-6 text-center text-sm text-brand-brown">
                    Questions about these terms? Contact{" "}
                    <a href="mailto:luca.haar@icloud.com" className="font-semibold text-brand-green underline">
                        luca.haar@icloud.com
                    </a>
                    .
                </div>
            </main>
        </div>
    );
};

export default TermsOfServicePage;
