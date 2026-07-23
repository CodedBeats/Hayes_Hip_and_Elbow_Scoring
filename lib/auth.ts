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
