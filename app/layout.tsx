// dependencies
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// style
import "./styles/globals.css";


// fonts
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// idk, probably important
export const metadata: Metadata = {
    title: "Hayes Hip and Elbow Scoring",
    description: "Not generated but written by hand with love",
};

// this is cool, why haven't I thought about this in the past
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
