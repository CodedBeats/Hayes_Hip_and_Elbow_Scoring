// dependencies
import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
// style
import "../styles/globals.css";
// components
import { Navbar } from "@/components/layout/Navbar";


// fonts
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

// idk, probably important
export const metadata: Metadata = {
    title: "Hayes Hip and Elbow Scoring",
    description: "Not generated but written by hand with love",
};

// this is cool, why haven't I thought about this in the past
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <Navbar />
                {children}
            </body>
        </html>
    );
}
