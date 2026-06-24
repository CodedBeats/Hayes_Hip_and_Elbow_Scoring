// dependencies
"use client";
import { useRouter } from "next/navigation";
// components

export default function Home() {
    const router = useRouter();

    return (
        <div>
            <button onClick={() => router.push("/submit")}>Submit Page</button>
            <button onClick={() => router.push("/pre-launch")}>Pre-launch Page</button>
        </div>
    );
}
