"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

const SEGMENT_LABELS: Record<string, string> = {
    dashboard:    "Dashboard",
    events:       "Events",
    analytics:    "Analytics",
    attendees:    "Attendees",
    scanners:     "Scanners",
    access:       "Access Log",
    edit:         "Edit",
    "new":        "New",
    import:       "Import",
    qrs:          "QR Codes",
    "smart-pages":"Review Pages",
    feedback:     "Feedback",
    settings:     "Settings",
    developer:    "Developer",
    notifications:"Notifications",
    webhooks:     "Webhooks",
    explorer:     "API Explorer",
    create:       "Create QR",
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length <= 1) return null;

    const crumbs = segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label =
            SEGMENT_LABELS[seg] ??
            seg.charAt(0).toUpperCase() + seg.slice(1);
        const isLast = idx === segments.length - 1;
        return { href, label, isLast };
    });

    return (
        <nav aria-label="Breadcrumb" className="hidden text-sm sm:flex items-center gap-1">
            <Link
                href="/dashboard"
                className="flex items-center text-slate-500 hover:text-white transition-colors"
                aria-label="Dashboard"
            >
                <Home className="h-3.5 w-3.5" />
            </Link>
            {crumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    {crumb.isLast ? (
                        <span className="font-medium text-white">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
