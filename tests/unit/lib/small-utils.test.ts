import { describe, it, expect, vi } from "vitest";
import { getAdminCaseDisplayStatus } from "@/lib/status";
import { formatFileSize } from "@/lib/formatFileSize";
import { getAuthErrorMessage, getResetErrorMessage } from "@/lib/auth";
import type { PaymentStatus } from "@/types/billing";
import type { SubmissionStatus } from "@/types/submission";

// lib/auth.ts imports the client Firebase app for `subscribeToAuthState` - stub it so
// the pure error mappers can be tested without initialising Firebase.
vi.mock("@/lib/firebase", () => ({ auth: {} }));

describe("getAdminCaseDisplayStatus", () => {
    const billing = (paymentStatus: PaymentStatus) => ({ billingType: "payNow" as const, amount: 133, paymentStatus });

    it("overrides any workflow status with 'unpaid' while payment is outstanding", () => {
        for (const status of ["pendingReview", "reviewing", "completed", "draft"] as SubmissionStatus[]) {
            expect(getAdminCaseDisplayStatus({ status, billing: billing("unpaid") })).toBe("unpaid");
        }
    });

    it.each(["paid", "test", "pending", "invoiced", "overdue"] as PaymentStatus[])(
        "shows the real workflow status once paymentStatus is %s",
        (paymentStatus) => {
            expect(getAdminCaseDisplayStatus({ status: "reviewing", billing: billing(paymentStatus) })).toBe("reviewing");
        },
    );
});

describe("formatFileSize", () => {
    it.each([
        [0, "0 B"],
        [1023, "1023 B"],
        [1024, "1.0 KB"],
        [1536, "1.5 KB"],
        [1024 * 1024 - 1, "1024.0 KB"],
        [1024 * 1024, "1.0 MB"],
        [20 * 1024 * 1024, "20.0 MB"],
        [1024 ** 3, "1.0 GB"],
        // caps at GB rather than inventing TB
        [5 * 1024 ** 4, "5120.0 GB"],
    ])("%i bytes -> %s", (bytes, expected) => {
        expect(formatFileSize(bytes)).toBe(expected);
    });
});

describe("getAuthErrorMessage", () => {
    it.each([
        ["auth/invalid-credential", "Incorrect email or password. Please try again."],
        ["auth/user-not-found", "Incorrect email or password. Please try again."],
        ["auth/wrong-password", "Incorrect email or password. Please try again."],
        ["auth/too-many-requests", "Too many failed attempts. Please wait a few minutes and try again."],
        ["auth/invalid-email", "Please enter a valid email address."],
        ["auth/user-disabled", "This account has been disabled. Contact the site administrator."],
        ["auth/network-request-failed", "Network error. Please check your connection and try again."],
        ["auth/something-new", "Something went wrong signing in. Please try again."],
    ])("%s", (code, message) => {
        expect(getAuthErrorMessage({ code })).toBe(message);
    });

    it("doesn't distinguish unknown user from wrong password (no account enumeration)", () => {
        expect(getAuthErrorMessage({ code: "auth/user-not-found" })).toBe(getAuthErrorMessage({ code: "auth/wrong-password" }));
    });

    it("falls back to an Error's own message when there's no code", () => {
        expect(getAuthErrorMessage(new Error("boom"))).toBe("boom");
    });

    it.each([null, undefined, "string error", 42, { code: 123 }])("handles a non-standard error (%j) without throwing", (err) => {
        expect(getAuthErrorMessage(err)).toBe("Something went wrong signing in. Please try again.");
    });
});

describe("getResetErrorMessage", () => {
    it("swallows user-not-found as a silent success (null) so account existence never leaks", () => {
        expect(getResetErrorMessage({ code: "auth/user-not-found" })).toBeNull();
    });

    it.each([
        ["auth/invalid-email", "Please enter a valid email address."],
        ["auth/too-many-requests", "Too many attempts. Please wait a few minutes and try again."],
        ["auth/network-request-failed", "Network error. Please check your connection and try again."],
        ["auth/other", "Something went wrong sending the reset email. Please try again."],
    ])("%s", (code, message) => {
        expect(getResetErrorMessage({ code })).toBe(message);
    });

    it("returns the generic message for a non-coded error", () => {
        expect(getResetErrorMessage(new Error("boom"))).toBe("Something went wrong sending the reset email. Please try again.");
    });
});