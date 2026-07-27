"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
    Webhook,
    Compass,
    BookOpen,
    Building2,
    ChevronDown,
    ChevronRight,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DASHBOARD_NAV,
    isNavGroup,
    type NavIcon,
    type NavItem,
    type NavGroup,
} from "./dashboard-nav";

const ICONS: Record<NavIcon, LucideIcon> = {
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

function NavLink({
    item,
    nested = false,
}: {
    item: NavItem;
    nested?: boolean;
}) {
    const pathname = usePathname();
    const isActive =
        item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = ICONS[item.icon];

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                nested ? "ml-3 pl-2.5" : "",
                isActive
                    ? "bg-indigo-600 text-white"
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
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-slate-400"
                )}
                aria-hidden
            />
            {item.name}
        </Link>
    );
}

function NavGroupSection({ group }: { group: NavGroup }) {
    const pathname = usePathname();
    const Icon = ICONS[group.icon];
    const isChildActive = group.items.some(
        (item) =>
            pathname === item.href || pathname.startsWith(`${item.href}/`)
    );

    const [open, setOpen] = useState(isChildActive);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                    isChildActive
                        ? "text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                aria-expanded={open}
            >
                <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {group.label}
                </span>
                {open ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                )}
            </button>
            {open && (
                <div className="mt-0.5 space-y-0.5 border-l border-slate-700 ml-4">
                    {group.items.map((item) => (
                        <NavLink key={item.href} item={item} nested />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Full sidebar navigation with grouped sections and collapsible groups.
 */
export function DashboardNav() {
    return (
        <nav
            className="flex-1 overflow-y-auto px-3 py-4"
            aria-label="Main navigation"
        >
            <div className="space-y-0.5">
                {DASHBOARD_NAV.map((entry) =>
                    isNavGroup(entry) ? (
                        <NavGroupSection key={entry.label} group={entry} />
                    ) : (
                        <NavLink key={entry.href} item={entry} />
                    )
                )}
            </div>
        </nav>
    );
}
