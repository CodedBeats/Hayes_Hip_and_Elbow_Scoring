import type { DogCase } from "@/types/dog";
import { DogIcon } from "@/components/misc/Icons";

const examTypeLabels: Record<DogCase["examType"], string> = {
    hipsAndElbows: "Hips & Elbows",
    hipsOnly: "Hips Only",
    elbowsOnly: "Elbows Only",
};

interface DogDetailsCardProps {
    dog: DogCase;
}

export const DogDetailsCard = ({ dog }: DogDetailsCardProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green-mid/15">
                    <DogIcon className="h-5 w-5 text-brand-green-mid" />
                </span>
                <h3 className="text-lg font-bold text-brand-brown">Dog Details</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                    <p className="text-gray-500">Pedigree Name</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{dog.registeredName}</p>
                </div>
                <div>
                    <p className="text-gray-500">Breed</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{dog.breed}</p>
                </div>
                <div>
                    <p className="text-gray-500">Microchip Number</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{dog.microchipNumber}</p>
                </div>
                <div>
                    <p className="text-gray-500">Registration Number</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{dog.registeredNumber ?? "—"}</p>
                </div>
                <div>
                    <p className="text-gray-500">Exam Type</p>
                    <p className="mt-0.5 font-semibold text-brand-brown">{examTypeLabels[dog.examType]}</p>
                </div>
                <div>
                    <p className="text-gray-500">Sex</p>
                    <p className="mt-0.5 font-semibold capitalize text-brand-brown">{dog.sex}</p>
                </div>
            </div>
        </div>
    );
};
