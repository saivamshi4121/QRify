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
    docs:          Compass,
    workspace:     LayoutDashboard,
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
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                nested ? "ml-4 pl-3" : "",
                isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
            onClick={() => {
                const toggle = document.getElementById(
                    "dashboard-sidebar-toggle"
                ) as HTMLInputElement | null;
                if (toggle) toggle.checked = false;
            }}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{
                        background: "linear-gradient(180deg, #818cf8, #22d3ee)",
                        boxShadow: "0 0 12px rgba(99,102,241,0.4)",
                    }}
                />
            )}

            {/* Background glow on active */}
            {isActive && (
                <div className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.06))",
                        boxShadow: "0 0 20px rgba(99,102,241,0.08)",
                    }}
                />
            )}

            <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                isActive
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "bg-white/[0.04] text-slate-500 group-hover:bg-white/[0.08] group-hover:text-slate-300"
            )}>
                <Icon className="h-4 w-4" aria-hidden />
            </div>
            <span className="relative z-10">{item.name}</span>
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
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isChildActive
                        ? "text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                )}
                aria-expanded={open}
            >
                <span className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                        isChildActive
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/[0.04] text-slate-500"
                    )}>
                        <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    {group.label}
                </span>
                <ChevronDown className={cn(
                    "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                    open ? "rotate-0" : "-rotate-90"
                )} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300",
                open ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
            )}>
                <div className="ml-4 border-l border-white/[0.06] pl-3 space-y-0.5">
                    {group.items.map((item) => (
                        <NavLink key={item.href} item={item} nested />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DashboardNav() {
    return (
        <nav
            className="flex-1 overflow-y-auto px-4 py-4"
            aria-label="Main navigation"
        >
            <div className="space-y-1">
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
