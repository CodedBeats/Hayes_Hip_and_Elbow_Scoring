import type { VeterinarianDetails } from "@/types/vet";
import { BriefcaseIcon, CheckCircleIcon } from "@/components/misc/Icons";

interface VetPracticeCardProps {
    vet: VeterinarianDetails;
    radiographDate: string;
}

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" });

export const VetPracticeCard = ({ vet, radiographDate }: VetPracticeCardProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green-mid/15">
                    <BriefcaseIcon className="h-5 w-5 text-brand-green-mid" />
                </span>
                <h3 className="text-lg font-bold text-brand-brown">Veterinary Practice Information</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
                <div>
                    <p className="text-gray-500">Attending Vet</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{vet.veterinarianName}</p>
                </div>
                <div>
                    <p className="text-gray-500">Practice Name</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{vet.practiceName}</p>
                </div>
                <div>
                    <p className="text-gray-500">Practice Phone</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{vet.phone}</p>
                </div>
                <div>
                    <p className="text-gray-500">Radiograph Date</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{formatDate(radiographDate)}</p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        vet.positiveIdentificationSighted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}
                >
                    {vet.positiveIdentificationSighted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                    ID Sighted
                </span>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        vet.certificateOfRegistrationSighted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}
                >
                    {vet.certificateOfRegistrationSighted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                    Registration Cert. Sighted
                </span>
            </div>
        </div>
    );
};
