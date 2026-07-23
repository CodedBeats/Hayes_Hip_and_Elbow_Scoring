"use client";
// eslint-disable-next-line -- referenced only via TSDoc {@link} for docs generation
import { DesktopOnlyGate } from '@/components/layout/DesktopOnlyGate';
// dependencies
import { useEffect, useState } from "react";

/**
 * the minimum width of a screen measured in pixels for use 
 * in - {@link useIsDesktop}
 */
const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * checks if the website is being viewed in desktop or mobile view
 * 
 * @remarks
 * Viewing/using the submission and admin pages on a mobile add too many layers of complexity in
 * both UX and development to satisfy all use-cases. For that they user is denied access unless
 * they are on a desktop (see use in - {@link DesktopOnlyGate})
 */
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
