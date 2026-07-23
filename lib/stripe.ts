// dependencies
import Stripe from "stripe";

// init stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
