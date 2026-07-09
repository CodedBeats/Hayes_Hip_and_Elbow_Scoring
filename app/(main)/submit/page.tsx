// dependencies
"use client";
// components
import { SubmissionFlow } from "../../../components/submission/SubmissionFlow";
import { DesktopOnlyGate } from "@/components/layout/DesktopOnlyGate";

export default function SubmitPage() {
    return (
        <DesktopOnlyGate>
            <div className="flex flex-col flex-1 items-center bg-cream font-sans">
                <main className="flex flex-1 w-full max-w-5xl flex-col py-10 px-6 sm:px-10">
                    <SubmissionFlow />
                </main>
            </div>
        </DesktopOnlyGate>
    );
}
