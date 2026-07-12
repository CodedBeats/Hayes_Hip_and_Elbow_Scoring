"use client";

import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

export function useIsDesktop(): boolean | null {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const mql = window.matchMedia(DESKTOP_QUERY);
        const update = () => setIsDesktop(mql.matches);
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, []);

    return isDesktop;
}
