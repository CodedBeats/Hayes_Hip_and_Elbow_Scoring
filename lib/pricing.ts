import type { ExamType } from "@/types/form";


// values taken from https://orchid.ankc.org.au/Home/HomeChed

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

export function calculatePrice(examType: ExamType, isDogsAustraliaRegistered: boolean) {
    const base = BASE_PRICES[examType];
    const levy = isDogsAustraliaRegistered ? 10 : 20;
    return { base, levy, total: base + levy };
}
