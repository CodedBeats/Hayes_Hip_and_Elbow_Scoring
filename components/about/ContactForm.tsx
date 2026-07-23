"use client";
// dependencies
import { useState } from "react";
// components
import { InputField } from "@/components/form/InputField";
import { Button } from "@/components/ui/Button";


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

    const handleSubmit = (e: React.FormEvent) => {
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
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className={["rounded-2xl border-2 border-brand-green-mid/20 bg-white p-8 text-center", className].join(" ")}>
                <p className="text-base font-semibold text-brand-brown">Message sent - thank you.</p>
                <p className="mt-1 text-sm text-gray-500">Dr Hayes will be in touch shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={["rounded-2xl border-2 border-brand-green-mid/20 bg-white p-8", className].join(" ")}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <InputField label="Name" name="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <InputField label="Email" name="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="mb-4 w-full">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Message</label>
                <textarea
                    name="message"
                    placeholder="How can we help?"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition"
                />
            </div>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <Button type="submit" variant="dark">
                Send Message
            </Button>
        </form>
    );
};
