import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: "Hayes Hip and Elbow Scoring",
    description: "Canine hip & elbow radiograph scoring for veterinary specialists",
    icons: {
        icon: [
            { url: "/logo/png/logo-16.png", sizes: "16x16", type: "image/png" },
            { url: "/logo/png/logo-32.png", sizes: "32x32", type: "image/png" },
            { url: "/logo/svg/logo-regular.svg", type: "image/svg+xml" },
        ],
        apple: [
            { url: "/logo/png/logo-180.png", sizes: "180x180", type: "image/png" },
        ],
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
