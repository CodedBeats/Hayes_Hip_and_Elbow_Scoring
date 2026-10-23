import { describe, it, expect } from "vitest";
import { resend } from "@/lib/resend";
import { contactNotificationEmail, contactConfirmationEmail } from "@/lib/emailTemplates";

/**
 * Live Resend smoke test - proves the rotated API key works and the sending domain is
 * still verified, using the real templates.
 *
 * @remarks
 * Both emails go to Resend's sink address `delivered@resend.dev`, never a real inbox -
 * this deliberately does NOT call `/api/contact`, since that would email the practice.
 */

// Must match FROM_EMAIL in app/api/contact/route.ts (not exported from the route).
const FROM_EMAIL = "Hayes Hip and Elbow Scoring <noreply@mail.hayes-hip-and-elbow-scoring.com>";
const SINK = "delivered@resend.dev";

describe.skipIf(!process.env.RESEND_API_KEY)("Resend (live, sink address)", () => {
    it("sends the practice notification template from the verified domain", async () => {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: SINK,
            replyTo: "vitest@example.com",
            ...contactNotificationEmail({ name: "Vitest Smoke", email: "vitest@example.com", message: "Automated smoke test - ignore." }),
        });
        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();
    });

    it("sends the confirmation template", async () => {
        const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: SINK, ...contactConfirmationEmail({ name: "Vitest Smoke" }) });
        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();
    });

    it("CONTACT_NOTIFICATION_RECIPIENT is set to a real-looking address", () => {
        expect(process.env.CONTACT_NOTIFICATION_RECIPIENT).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
});