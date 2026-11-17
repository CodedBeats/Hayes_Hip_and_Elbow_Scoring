import { describe, it, expect } from "vitest";
import { calculatePrice, EXAM_LABELS } from "@/lib/pricing";
import type { ExamType } from "@/types/form";

const EXAM_TYPES = Object.keys(EXAM_LABELS) as ExamType[];
const ALL_COMBOS = EXAM_TYPES.flatMap((e) => [[e, true], [e, false]] as const);

describe("calculatePrice", () => {
    // toEqual also fails if any extra key (e.g. a reintroduced `fee`) comes back
    it.each([
        // [examType, registered, base, levy, total]
        ["hipsAndElbows", true, 120, 10, 130],
        ["hipsAndElbows", false, 120, 20, 140],
        ["hipsOnly", true, 100, 10, 110],
        ["hipsOnly", false, 100, 20, 120],
        ["elbowsOnly", true, 50, 10, 60],
        ["elbowsOnly", false, 50, 20, 70],
    ] as const)("%s (registered=%s) -> base %i + levy %i = %i", (examType, registered, base, levy, total) => {
        expect(calculatePrice(examType, registered)).toEqual({ base, levy, total });
    });

    it("charges the $10 levy for DA-registered dogs and $20 otherwise", () => {
        for (const examType of EXAM_TYPES) {
            expect(calculatePrice(examType, true).levy).toBe(10);
            expect(calculatePrice(examType, false).levy).toBe(20);
        }
    });

    // The practice absorbs Stripe's processing fee (accountant's advice) - nothing may be
    // added on top of the exam price + ANKC levy.
    it.each(ALL_COMBOS)("%s (registered=%s): total is exactly base + levy, with no fee passed on", (examType, registered) => {
        const { base, levy, total } = calculatePrice(examType, registered);
        expect(total).toBe(base + levy);
    });

    it("always returns whole-dollar totals, so unit_amount * 100 is an exact integer in cents", () => {
        for (const [examType, registered] of ALL_COMBOS) {
            expect(Number.isInteger(calculatePrice(examType, registered).total)).toBe(true);
        }
    });

    it("has a label for every exam type", () => {
        expect(EXAM_LABELS).toEqual({
            hipsAndElbows: "Hips & Elbows",
            hipsOnly: "Hips Only",
            elbowsOnly: "Elbows Only",
        });
    });
});