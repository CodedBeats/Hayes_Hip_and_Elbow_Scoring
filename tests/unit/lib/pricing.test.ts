import { describe, it, expect } from "vitest";
import { calculatePrice, EXAM_LABELS } from "@/lib/pricing";
import type { ExamType } from "@/types/form";

const EXAM_TYPES = Object.keys(EXAM_LABELS) as ExamType[];

// Mirrors the private STRIPE_FEE constant in lib/pricing.ts - if that's retuned, these
// invariants still hold but this needs updating to match.
const STRIPE_PERCENT = 0.017;
const STRIPE_FIXED_DOLLARS = 0.3;

/** What actually lands in the practice's account after Stripe takes its cut. */
const netAfterStripe = (total: number) => total * (1 - STRIPE_PERCENT) - STRIPE_FIXED_DOLLARS;

describe("calculatePrice", () => {
    it.each([
        // [examType, registered, base, levy, fee, total]
        ["hipsAndElbows", true, 120, 10, 3, 133],
        ["hipsAndElbows", false, 120, 20, 3, 143],
        ["hipsOnly", true, 100, 10, 3, 113],
        ["hipsOnly", false, 100, 20, 3, 123],
        ["elbowsOnly", true, 50, 10, 2, 62],
        ["elbowsOnly", false, 50, 20, 2, 72],
    ] as const)("%s (registered=%s) -> base %i + levy %i + fee %i = %i", (examType, registered, base, levy, fee, total) => {
        expect(calculatePrice(examType, registered)).toEqual({ base, levy, fee, total });
    });

    it("charges the $10 levy for DA-registered dogs and $20 otherwise", () => {
        for (const examType of EXAM_TYPES) {
            expect(calculatePrice(examType, true).levy).toBe(10);
            expect(calculatePrice(examType, false).levy).toBe(20);
        }
    });

    // The whole point of grossing up: base + levy must survive Stripe's cut intact.
    it.each(EXAM_TYPES.flatMap((e) => [[e, true], [e, false]] as const))(
        "%s (registered=%s): practice nets at least base + levy after Stripe fees",
        (examType, registered) => {
            const { base, levy, total } = calculatePrice(examType, registered);
            expect(netAfterStripe(total)).toBeGreaterThanOrEqual(base + levy);
        },
    );

    it.each(EXAM_TYPES.flatMap((e) => [[e, true], [e, false]] as const))(
        "%s (registered=%s): fee is the smallest whole dollar that covers Stripe",
        (examType, registered) => {
            const { base, levy, fee } = calculatePrice(examType, registered);
            // one dollar less would leave the practice short
            expect(netAfterStripe(base + levy + fee - 1)).toBeLessThan(base + levy);
        },
    );

    it("always returns whole-dollar amounts, so unit_amount * 100 is an exact integer in cents", () => {
        for (const examType of EXAM_TYPES) {
            for (const registered of [true, false]) {
                const { total, fee } = calculatePrice(examType, registered);
                expect(Number.isInteger(total)).toBe(true);
                expect(Number.isInteger(fee)).toBe(true);
            }
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