export type ContactRequest = {
    name: string;
    email: string;
    message: string;
    /**
     * Honeypot. Rendered off-screen and hidden from real users - if this arrives
     * non-empty, a bot filled it. Optional so a legitimate payload can omit it.
     */
    company?: string;
    /**
     * Client-measured milliseconds between the form mounting and submit. Used as a
     * cheap bot signal (implausibly fast, or missing entirely). A delta, not a
     * timestamp, so client clock skew doesn't matter.
     */
    elapsedMs?: number;
};

export type ContactResponse = {
    success: boolean;
};
