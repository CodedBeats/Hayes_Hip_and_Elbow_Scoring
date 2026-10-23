import { describe, it, expect } from "vitest";
import { contactNotificationEmail, contactConfirmationEmail } from "@/lib/emailTemplates";

const HOSTILE = {
    name: `<script>alert("x")</script>`,
    email: `"><img src=x onerror=alert(1)>@evil.com`,
    message: `Click <a href='https://phish.example'>here</a> & win`,
};

describe("contactNotificationEmail", () => {
    it("escapes every user-supplied field in the HTML body", () => {
        const { html } = contactNotificationEmail(HOSTILE);

        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<img src=x");
        expect(html).not.toContain("<a href='https://phish.example'>");

        expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
        expect(html).toContain("&quot;&gt;&lt;img src=x onerror=alert(1)&gt;@evil.com");
        expect(html).toContain("Click &lt;a href=&#39;https://phish.example&#39;&gt;here&lt;/a&gt; &amp; win");
    });

    it("escapes the email inside the mailto: href too, so it can't break out of the attribute", () => {
        const { html } = contactNotificationEmail(HOSTILE);
        expect(html).toContain(`href="mailto:&quot;&gt;&lt;img`);
    });

    it("keeps the plain-text part raw (no HTML entities to read through)", () => {
        const { text } = contactNotificationEmail(HOSTILE);
        expect(text).toContain(HOSTILE.name);
        expect(text).toContain(HOSTILE.message);
        expect(text).not.toContain("&lt;");
    });

    it("is unflagged by default", () => {
        const { subject, html, text } = contactNotificationEmail({ name: "Jane", email: "j@x.com", message: "hi" });
        expect(subject).toBe("New contact form message from Jane");
        expect(html).not.toContain("automatically flagged");
        expect(text).not.toContain("FLAGGED");
    });

    it("prefixes the subject and adds a banner when flagged, without altering the message", () => {
        const { subject, html, text } = contactNotificationEmail({ name: "Jane", email: "j@x.com", message: "rude words", flagged: true });
        expect(subject.startsWith("[⚠️ FLAGGED] ")).toBe(true);
        expect(html).toContain("automatically flagged for possible profanity");
        expect(html).toContain("rude words");
        expect(text.startsWith("** FLAGGED")).toBe(true);
    });

    it("wraps content in the branded layout", () => {
        const { html } = contactNotificationEmail({ name: "Jane", email: "j@x.com", message: "hi" });
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("https://www.hayes-hip-and-elbow-scoring.com/logo/png/logo-180.png");
        expect(html).toContain("Visit our website");
    });
});

describe("contactConfirmationEmail", () => {
    it("greets by (escaped) name", () => {
        const { subject, html, text } = contactConfirmationEmail({ name: HOSTILE.name });
        expect(subject).toBe("We've received your message");
        expect(html).toContain("Thanks for reaching out, &lt;script&gt;");
        expect(html).not.toContain("<script>");
        expect(text.startsWith(`Hi ${HOSTILE.name},`)).toBe(true);
    });
});