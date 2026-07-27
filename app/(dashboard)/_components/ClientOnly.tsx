"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders `fallback` on the server and the first client paint, then `children`
 * after mount. Avoids hydration mismatches from Turbopack HMR / locale / etc.
 * (Next.js 16 forbids next/dynamic ssr:false in Server Components.)
 */
export function ClientOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <>{fallback}</>;
    return <>{children}</>;
}
