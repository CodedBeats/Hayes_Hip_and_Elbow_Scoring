import type { ExamType } from "@/types/form";


/**
 * @see https://orchid.ankc.org.au/Home/HomeChed
 */
export const EXAM_LABELS: Record<ExamType, string> = {
    hipsAndElbows: "Hips & Elbows",
    hipsOnly: "Hips Only",
    elbowsOnly: "Elbows Only",
};

/**
 * @see https://orchid.ankc.org.au/Home/HomeChed
 */
const BASE_PRICES: Record<ExamType, number> = {
    hipsAndElbows: 120,
    hipsOnly: 100,
    elbowsOnly: 50,
};

/**
 * Stripe's standard AU domestic card rate (percentage + fixed cents per transaction).
 *
 * @remarks
 * This is an approximation: Stripe charges more for international and Amex cards, so this
 * under-covers those. It's a deliberate simplification rather than charging different
 * customers different fees based on card type, which Checkout can't preview before payment
 * anyway. Retune here if the practice's actual negotiated rate differs -
 * {@link https://stripe.com/au/pricing | Stripe AU pricing}.
 */
const STRIPE_FEE = { percent: 0.017, fixed: 30 };

/**
 * Calculates the total price for a submission's exam type, inclusive of the Stripe
 * processing fee.
 *
 * @remarks
 * `levy` is the ANKC scoring-scheme levy, not a platform fee: it's $10 for a dog already
 * registered with Dogs Australia, $20 otherwise. This discount/surcharge is an ANKC rule,
 * not something this project can change independently - see
 * {@link https://orchid.ankc.org.au/Home/HomeChed | the ANKC ORCHID scheme page} if the
 * base prices or levy ever need updating.
 *
 * `fee` is "grossed up" rather than a naive `(base + levy) * percent + fixed`: the naive
 * version undercharges, because Stripe's percentage cut is taken from the *total* charged
 * (including the fee itself), not just the base+levy. Grossing up solves for the fee that
 * makes `base + levy` land in the practice's account after Stripe's cut, by dividing
 * through by `(1 - percent)` instead of multiplying by it.
 *
 * @returns The `base` exam price, the `levy`, the `fee`, and their `total` (all in dollars).
 */
export const calculatePrice = (examType: ExamType, isDogsAustraliaRegistered: boolean) => {
    const base = BASE_PRICES[examType];
    const levy = isDogsAustraliaRegistered ? 10 : 20;

    const subtotal = base + levy;
    const fee = Math.ceil((subtotal + STRIPE_FEE.fixed / 100) / (1 - STRIPE_FEE.percent) - subtotal);

    return { base, levy, fee, total: subtotal + fee };
}
