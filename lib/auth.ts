// depenedinces
import { onAuthStateChanged, type User } from "firebase/auth";
// lib
import { auth } from "./firebase";

// firebase auth state
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// auth error handling helper
export const getAuthErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return "Incorrect email or password. Please try again.";
            case "auth/too-many-requests":
                return "Too many failed attempts. Please wait a few minutes and try again.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/user-disabled":
                return "This account has been disabled. Contact the site administrator.";
            case "auth/network-request-failed":
                return "Network error. Please check your connection and try again.";
            default:
                return "Something went wrong signing in. Please try again.";
        }
    }

    return error instanceof Error ? error.message : "Something went wrong signing in. Please try again.";
};

/**
 * Maps a `resetPassword` failure to a user-facing message, or `null` if the
 * failure should be treated as a silent success.
 *
 * @remarks
 * `auth/user-not-found` is deliberately swallowed (returns `null`) rather than
 * surfaced - the caller must fall through to the same generic "if an account
 * exists, a reset link has been sent" message it shows on the happy path, so
 * account existence is never leaked.
 */
export const getResetErrorMessage = (error: unknown): string | null => {
    if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
        switch (error.code) {
            case "auth/user-not-found":
                return null;
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/too-many-requests":
                return "Too many attempts. Please wait a few minutes and try again.";
            case "auth/network-request-failed":
                return "Network error. Please check your connection and try again.";
            default:
                return "Something went wrong sending the reset email. Please try again.";
        }
    }
    return "Something went wrong sending the reset email. Please try again.";
};
