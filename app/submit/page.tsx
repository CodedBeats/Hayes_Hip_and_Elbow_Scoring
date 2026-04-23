// dependencies
"use client";
import { useRouter } from "next/navigation";
// components
import { CaseForm } from "../../components/form/CaseForm";

export default function SubmitPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <button onClick={() => router.push("/")}>Home</button>
                <CaseForm />
            </main>
        </div>
    );
}