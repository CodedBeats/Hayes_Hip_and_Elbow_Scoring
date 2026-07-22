import type { ExamType } from "@/types/form";


/**
 * @see https://orchid.ankc.org.au/Home/HomeChed
 */
export const EXAM_LABELS: Record<ExamType, string> = {
    hipsAndElbows: "Hips & Elbows",
    hipsOnly: "Hips Only",
    elbowsOnly: "Elbows Only",
};

const BASE_PRICES: Record<ExamType, number> = {
    hipsAndElbows: 120,
    hipsOnly: 100,
    elbowsOnly: 50,
};

/**
 * Calculates the total price for a submission's exam type.
 *
 * @remarks
 * `levy` is the ANKC scoring-scheme levy, not a platform fee: it's $10 for a dog already
 * registered with Dogs Australia, $20 otherwise. This discount/surcharge is an ANKC rule,
 * not something this project can change independently - see
 * {@link https://orchid.ankc.org.au/Home/HomeChed | the ANKC ORCHID scheme page} if the
 * base prices or levy ever need updating.
 *
 * @returns The `base` exam price, the `levy`, and their `total`.
 */
export const calculatePrice = (examType: ExamType, isDogsAustraliaRegistered: boolean) => {
    const base = BASE_PRICES[examType];
    const levy = isDogsAustraliaRegistered ? 10 : 20;
    return { base, levy, total: base + levy };
}
