"use client";
// dependencies
import { useState } from "react";
// components
import { InputField } from "@/components/form/InputField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
// types
import type { ContactRequest } from "@/types/contact";


// ty stack overflow
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


interface ContactFormProps {
    className?: string;
}

export const ContactForm = ({ className = "" }: ContactFormProps) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message } satisfies ContactRequest),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? data.errors?.[0] ?? "Failed to send message");
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
                <InputField label="Name" name="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <InputField label="Email" name="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <Textarea label="Message" name="message" placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} />

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <Button type="submit" variant="dark" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
        </form>
    );
};
