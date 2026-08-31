// dependencies
import Stripe from "stripe";

// init stripe
// apiVersion is pinned explicitly rather than left on the package default, so a future
// `npm update` of the stripe package can't silently change request/response shapes.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
});
