import { PolicySection } from "@/components/misc/PolicySection";
import { ReceiptIcon, ScaleIcon, ArrowUpRightIcon } from "@/components/misc/Icons";

const appealFees = [
    { type: "Hips and Elbows Appeal", fee: "$250" },
    { type: "Hips Only Appeal", fee: "$200" },
    { type: "Elbows Only Appeal", fee: "$100" },
    { type: "Administration Fee", fee: "$50" },
];

const AppealsPage = () => {
    return (
        <div className="flex flex-col flex-1 items-center bg-cream font-sans">
            <main className="flex flex-1 w-full max-w-6xl flex-col py-10 px-6 sm:px-10">
                <div className="mb-6 flex flex-col gap-2 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-brand-brown sm:text-4xl">Refund & Appeals Policy</h1>
                    <p className="text-sm text-gray-500">Last updated: 3rd July 2026</p>
                </div>

                <div className="flex flex-col rounded-2xl border-2 border-brand-green-mid/20 bg-white p-6 sm:p-10">
                    <PolicySection icon={<ReceiptIcon />} title="Overview">
                        <p>
                            Submitting a radiograph for scoring is a considered process - you&apos;ve prepared
                            imaging, gathered your dog&apos;s, owner&apos;s & vet&apos;s details, and reviewed the requirements before paying.
                            It&apos;s not something submitted by accident, so our refund policy is straightforward.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ReceiptIcon />} title="No Refunds on Completed Submissions">
                        <p>
                            Because of this, we&apos;re not able to offer a refund simply for a change of mind once
                            your submission has been scored. If you believe your score is incorrect, the appeals
                            process below is the right path forward.
                        </p>
                    </PolicySection>

                    <PolicySection icon={<ScaleIcon />} title="Appeals Process">
                        <p className="mb-4">
                            The appeals process itself is handled entirely by Dogs Australia (ANKC) - we don&apos;t
                            manage, review, or have any involvement in appeals. Our role is limited to providing the
                            pricing and information below and pointing you to Dogs Australia&apos;s official
                            resources. If you&apos;d like to formally appeal a score, an appeal fee applies depending
                            on the type of assessment, set by the established Dogs Australia CHED appeal scheme.
                        </p>

                        <div className="overflow-hidden rounded-xl border border-brand-green-mid/20">
                            <table className="w-full text-left text-sm sm:text-base">
                                <thead className="bg-warm-sand text-brand-brown">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Appeal Type</th>
                                        <th className="px-4 py-3 font-semibold text-right">Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-green-mid/10">
                                    {appealFees.map(({ type, fee }) => (
                                        <tr key={type}>
                                            <td className="px-4 py-3 text-gray-700">{type}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-brand-brown">{fee}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Fees current as of the last update above - confirm against the official Dogs Australia
                            website, as fees and process are set and maintained by them, not by us.
                        </p>

                        <a
                            href="https://orchid.ankc.org.au/Content/CHED/CHEDS%20Appeal%20Procedure1.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center gap-2 rounded-xl bg-warm-sand px-4 py-3 text-sm font-medium text-brand-green hover:underline"
                        >
                            <ArrowUpRightIcon />
                            View the official CHED Appeal Procedure (PDF)
                        </a>

                        <a
                            href="https://dogsaustralia.org.au/members/health-wellbeing/cheds-canine-hip-and-elbow-dysplasia-scheme/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-2 rounded-xl bg-warm-sand px-4 py-3 text-sm font-medium text-brand-green hover:underline"
                        >
                            <ArrowUpRightIcon />
                            Visit the Dogs Australia CHED Scheme page
                        </a>
                    </PolicySection>

                    <PolicySection icon={<ReceiptIcon />} title="Errors On Our End">
                        <p>
                            Had a payment issue, a duplicate charge, or something didn&apos;t go as expected on our
                            end? These situations are rare, but if one comes up, just reach out to Anna directly and
                            she&apos;ll sort it out. This is separate from the appeals process above, which is
                            handled by Dogs Australia.
                        </p>
                    </PolicySection>
                </div>

                <div className="mt-6 rounded-2xl bg-warm-sand p-6 text-center text-sm text-brand-brown">
                    Questions about a payment? Contact{" "}
                    <a href="mailto:anahayes18@icloud.com" className="font-semibold text-brand-green underline">
                        anahayes18@icloud.com
                    </a>
                    . For questions about an appeal itself, please contact Dogs Australia directly.
                </div>
            </main>
        </div>
    );
};

export default AppealsPage;
