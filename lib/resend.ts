// dependencies
import { Resend } from "resend";

// init resend - safe to init eagerly since the constructor only stores the API key
// and doesn't validate it or make a network call (unlike lib/firebaseAdmin.ts's lazy
// getter, which exists because Firebase's cert()/initializeApp() can throw at import
// time and break `next build`)
export const resend = new Resend(process.env.RESEND_API_KEY!);
