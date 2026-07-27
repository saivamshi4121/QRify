"use client";

/**
 * @deprecated Use DashboardNav.tsx which renders the full grouped navigation.
 * Kept only for backward compatibility.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    QrCode,
    Settings,
    PlusCircle,
    MessageSquare,
    FileText,
    BarChart3,
    CalendarDays,
    Bell,
    Key,
    Compass,
    BookOpen,
    Building2,
    Webhook,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardNavIcon } from "./dashboard-nav";

const ICONS: Record<DashboardNavIcon, LucideIcon> = {
    dashboard:     LayoutDashboard,
    analytics:     BarChart3,
    events:        CalendarDays,
    qrs:           QrCode,
    pages:         FileText,
    feedback:      MessageSquare,
    create:        PlusCircle,
    settings:      Settings,
    notifications: Bell,
    apikeys:       Key,
    webhooks:      Webhook,
    explorer:      Compass,
    docs:          BookOpen,
    workspace:     Building2,
};

type DashboardNavLinkProps = {
    href: string;
    name: string;
    icon: DashboardNavIcon;
};

export function DashboardNavLink({ href, name, icon }: DashboardNavLinkProps) {
    const pathname = usePathname();
    const isActive =
        pathname === href || pathname.startsWith(`${href}/`);
    const Icon = ICONS[icon] ?? LayoutDashboard;

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
            onClick={() => {
                const toggle = document.getElementById(
                    "dashboard-sidebar-toggle"
                ) as HTMLInputElement | null;
                if (toggle) toggle.checked = false;
            }}
        >
            <Icon
                className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-white" : "text-slate-400"
                )}
                aria-hidden
            />
            {name}
        </Link>
    );
}
