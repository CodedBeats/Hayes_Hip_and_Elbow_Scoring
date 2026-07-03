import { PolicySection } from "@/components/misc/PolicySection";
import { ShieldCheckIcon, ClipboardIcon, ScanIcon, LockClosedIcon, EnvelopeIcon } from "@/components/misc/Icons";

const PrivacyPolicyPage = () => {
    return (
        <div className="flex flex-col flex-1 items-center bg-cream font-sans">
            <main className="flex flex-1 w-full max-w-6xl flex-col py-10 px-6 sm:px-10">
                <div className="mb-6 flex flex-col gap-2 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-brand-brown sm:text-4xl">Privacy Policy</h1>
                    <p className="text-sm text-gray-500">Last updated: July 2026</p>
                </div>

                <div className="flex flex-col rounded-2xl border-2 border-brand-green-mid/20 bg-white p-6 sm:p-10">
                    <PolicySection icon={<ShieldCheckIcon />} title="Overview">
                        <p>
                            We collect only the information needed to process and score your hip and elbow radiograph
                            submissions. We don&apos;t sell your data, and we don&apos;t share it beyond what&apos;s
                            required to run the service.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ClipboardIcon className="w-7 h-7 text-brand-green" />} title="What We Collect">
                        <p>
                            Owner and breeder contact details, your dog&apos;s identification (name, breed,
                            microchip or registration number), the radiograph images you upload, and confirmation
                            that payment was received.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScanIcon className="w-7 h-7 text-brand-green" />} title="How We Use It">
                        <p>
                            To score your submission, send you the results, and process your payment. Radiographs
                            and submission records may also be retained to support a future appeal, should you
                            need one.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<LockClosedIcon className="w-7 h-7 text-brand-green" />} title="Storage & Security">
                        <p>
                            Radiograph images are stored via AWS S3, and submission records are stored in Firebase
                            Firestore. We take reasonable technical measures to keep this data secure, though no
                            online storage can be guaranteed 100% secure.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<EnvelopeIcon className="w-7 h-7 text-brand-green" />} title="Third Parties">
                        <p>
                            Payments are processed by Stripe - we never see or store your card details. We don&apos;t
                            share your information with advertisers or other third parties.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ShieldCheckIcon />} title="Your Rights">
                        <p>
                            You can request access to, or deletion of, your personal data at any time by contacting
                            us directly.
                        </p>
                    </PolicySection>
                </div>

                <div className="mt-6 rounded-2xl bg-warm-sand p-6 text-center text-sm text-brand-brown">
                    Questions about this policy? Contact{" "}
                    <a href="mailto:luca.haar@icloud.com" className="font-semibold text-brand-green underline">
                        luca.haar@icloud.com
                    </a>
                    .
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicyPage;
