import type { ContactRequest } from "@/types/contact";

/**
 * Absolute, publicly-reachable URL for the practice's logo/banner image.
 *
 * @remarks
 * Email clients fetch images over the internet, so this can't point at a relative
 * `/public` path, only a deployed URL. While empty, {@link emailLayout} falls back to
 * a text wordmark banner instead of an `<img>`.
 */
const LOGO_URL = "https://www.hayes-hip-and-elbow-scoring.com/logo/png/logo-512.png";

/** Public site URL, used to link the email banner and footer back to the website. */
const WEBSITE_URL = "https://www.hayes-hip-and-elbow-scoring.com/";

const BRAND_GREEN = "#506147";
const BRAND_BROWN = "#3E2B23";
const CREAM = "#F9F7F3";
const WARM_SAND = "#F2E8D5";
const FONT_STACK = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";

type EmailBody = {
    subject: string;
    html: string;
    text: string;
};

/**
 * Escapes HTML-significant characters in untrusted input before interpolating it into
 * an email template.
 *
 * @remarks
 * `name`, `email`, and `message` all come straight from the public contact form - without
 * this, a submitter could inject markup (links, styling, spoofed content) into the HTML
 * email the practice receives.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Wraps templated body content in the shared branded HTML shell (banner, card, footer).
 *
 * @remarks
 * Table-based layout with inline styles only, no external CSS/webfonts - the
 * conventional approach for cross-client email compatibility (Outlook in particular
 * only reliably renders inline-styled tables).
 */
function emailLayout(bodyHtml: string): string {
    const bannerContent = LOGO_URL
        ? `<img src="${LOGO_URL}" alt="Hayes Hip and Elbow Scoring" width="180" style="display:block; margin:0 auto;" />`
        : `<span style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; letter-spacing:0.02em; color:${CREAM};">Hayes Hip and Elbow Scoring</span>`;
    const banner = `<a href="${WEBSITE_URL}" style="text-decoration:none; color:${CREAM}">${bannerContent}</a>`;

    return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:${CREAM}; font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:${BRAND_GREEN}; padding:28px 24px;">
                ${banner}
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px 32px; color:${BRAND_BROWN}; font-family:${FONT_STACK}; font-size:15px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:${WARM_SAND}; padding:16px 32px; text-align:center; color:${BRAND_BROWN}; font-family:${FONT_STACK}; font-size:12px;">
                Hayes Hip and Elbow Scoring<br />
                <a href="${WEBSITE_URL}" style="color:${BRAND_BROWN};">Visit our website</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/** Email sent to the practice inbox notifying staff of a new contact form submission. */
export function contactNotificationEmail({ name, email, message }: ContactRequest): EmailBody {
    const subject = `New contact form message from ${name}`;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    const html = emailLayout(`
    <h1 style="margin:0 0 16px 0; font-size:20px; color:${BRAND_BROWN};">New Contact Form Submission</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:20px;">
      <tr>
        <td style="padding:4px 0; font-weight:700; width:80px; vertical-align:top;">Name</td>
        <td style="padding:4px 0;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0; font-weight:700; vertical-align:top;">Email</td>
        <td style="padding:4px 0;"><a href="mailto:${safeEmail}" style="color:${BRAND_GREEN};">${safeEmail}</a></td>
      </tr>
    </table>
    <div style="background-color:${WARM_SAND}; border-radius:6px; padding:16px 20px; white-space:pre-wrap;">${safeMessage}</div>
    <p style="margin:20px 0 0 0; font-size:13px; color:${BRAND_BROWN}; opacity:0.75;">Reply to this email to respond directly to ${safeName}.</p>
  `);

    const text = `New contact form message from ${name}\n\nName: ${name}\nEmail: ${email}\n\n${message}\n\n${WEBSITE_URL}`;

    return { subject, html, text };
}

/** Confirmation email sent back to the person who submitted the contact form. */
export function contactConfirmationEmail({ name }: Pick<ContactRequest, "name">): EmailBody {
    const subject = "We've received your message";
    const safeName = escapeHtml(name);

    const html = emailLayout(`
    <h1 style="margin:0 0 16px 0; font-size:20px; color:${BRAND_BROWN};">Thanks for reaching out, ${safeName}</h1>
    <p style="margin:0 0 12px 0;">We've received your message and Dr Hayes will be in touch shortly.</p>
    <p style="margin:0;">In the meantime, feel free to reply to this email if you'd like to add anything.</p>
  `);

    const text = `Hi ${name},\n\nThanks for reaching out - Dr Hayes will be in touch shortly.\n\n${WEBSITE_URL}`;

    return { subject, html, text };
}
