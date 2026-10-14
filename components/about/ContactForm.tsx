"use client";
// dependencies
import { useEffect, useRef, useState } from "react";
// components
import { InputField } from "@/components/form/InputField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
// lib
import { EMAIL_REGEX, FIELD_LIMITS } from "@/lib/security";
// types
import type { ContactRequest } from "@/types/contact";


interface ContactFormProps {
    className?: string;
}

export const ContactForm = ({ className = "" }: ContactFormProps) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    // Honeypot - real users never see this field, so it should always be empty.
    const [company, setCompany] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Wall-clock time the form mounted - the submit handler sends the elapsed time
    // as a cheap bot signal (see lib/security looksLikeBot). Set in an effect since
    // reading the clock during render isn't pure.
    const mountedAt = useRef<number | null>(null);
    useEffect(() => {
        mountedAt.current = Date.now();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!message.trim()) {
            setError("Please enter a message.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        const mountTime = mountedAt.current;

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    message,
                    company,
                    elapsedMs: mountTime === null ? undefined : Date.now() - mountTime,
                } satisfies ContactRequest),
            });
            const data = await res.json();

            if (!res.ok) {
                // The API returns actionable messages for some cases (rate limit,
                // disposable email) - surface those; fall back to generic otherwise.
                setError(data.error ?? data.errors?.[0] ?? "Something went wrong sending your message. Please try again.");
                return;
            }

            setSubmitted(true);
        } catch {
            setError("Something went wrong sending your message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setMessage("");
        setError(null);
        setSubmitted(false);
    };

    if (submitted) {
        return (
            <div className={["rounded-2xl border-2 border-brand-green-mid/20 bg-white p-8 text-center", className].join(" ")}>
                <p className="text-base font-semibold text-brand-brown">Message sent - thank you.</p>
                <p className="mt-1 text-sm text-gray-500">Dr Hayes will be in touch shortly.</p>
                <Button type="button" variant="dark" size="sm" onClick={handleReset} className="mt-4">
                    Send another message?
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={["rounded-2xl border-2 border-brand-green-mid/20 bg-white p-8", className].join(" ")}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <InputField label="Name" name="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={FIELD_LIMITS.name} />
                <InputField label="Email" name="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={FIELD_LIMITS.email} />
            </div>

            <Textarea label="Message" name="message" placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={FIELD_LIMITS.message} />

            {/* Honeypot: hidden from humans (off-screen, not focusable, not announced), bots fill it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="company">Company</label>
                <input
                    id="company"
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />
            </div>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <Button type="submit" variant="dark" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
        </form>
    );
};
