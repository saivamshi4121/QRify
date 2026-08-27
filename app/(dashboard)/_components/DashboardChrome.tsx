import { QrCode, Menu, X, Plus, Search } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { DashboardNav } from "./DashboardNav";
import { DashboardSignOutButton } from "./DashboardSignOutButton";
import { Breadcrumbs } from "./Breadcrumbs";
import Link from "next/link";

export type DashboardUserSummary = {
    name: string;
    subscriptionPlan: string;
};

export function DashboardChrome({
    user,
    children,
}: {
    user: DashboardUserSummary;
    children: React.ReactNode;
}) {
    const initial = (user.name || "U").charAt(0).toUpperCase();
    const plan = user.subscriptionPlan || "Free";

    return (
        <div className="min-h-screen bg-[#080b14]">
            {/* Peer checkbox: checked = mobile sidebar open */}
            <input
                id="dashboard-sidebar-toggle"
                type="checkbox"
                className="peer/sidebar sr-only"
                aria-hidden
            />

            {/* Backdrop (mobile) */}
            <label
                htmlFor="dashboard-sidebar-toggle"
                className="pointer-events-none fixed inset-0 z-40 bg-black/60 opacity-0 backdrop-blur-sm transition-opacity peer-checked/sidebar:pointer-events-auto peer-checked/sidebar:opacity-100 lg:hidden"
                aria-label="Close menu"
            />

            {/* ── Sidebar ── */}
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] -translate-x-full flex-col transition-transform duration-300 peer-checked/sidebar:translate-x-0 lg:translate-x-0"
                style={{
                    background: "linear-gradient(180deg, #0c1021 0%, #080b14 100%)",
                    borderRight: "1px solid rgba(99,102,241,0.08)",
                }}
            >
                {/* Subtle glow on sidebar */}
                <div className="absolute top-0 right-0 w-px h-full pointer-events-none"
                    style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 50%, transparent 100%)" }}
                />

                {/* Logo */}
                <div className="relative flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15))",
                            border: "1px solid rgba(99,102,241,0.2)",
                            boxShadow: "0 0 20px rgba(99,102,241,0.1)",
                        }}
                    >
                        <QrCode className="h-4.5 w-4.5 text-indigo-400" aria-hidden />
                    </div>
                    <div>
                        <span className="text-[15px] font-bold tracking-tight text-white">
                            Qrezo
                        </span>
                        <span className="block text-[9px] font-mono text-slate-500 tracking-widest uppercase -mt-0.5">
                            Control Center
                        </span>
                    </div>
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="ml-auto cursor-pointer lg:hidden"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
                    </label>
                </div>

                {/* Workspace pill */}
                <div className="border-b border-white/[0.06] px-4 py-3">
                    <WorkspaceSwitcher variant="sidebar" />
                </div>

                {/* Navigation */}
                <DashboardNav />

                {/* User Footer */}
                <div className="border-t border-white/[0.06] p-4">
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                boxShadow: "0 0 16px rgba(99,102,241,0.25)",
                            }}
                        >
                            {initial}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold leading-tight text-white">
                                {user.name}
                            </p>
                            <p className="text-[11px] capitalize text-slate-500 font-medium">
                                {plan} plan
                            </p>
                        </div>
                    </div>
                    <DashboardSignOutButton />
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="lg:pl-[260px]">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] px-4 backdrop-blur-xl sm:px-6"
                    style={{ background: "rgba(8,11,20,0.8)" }}
                >
                    {/* Mobile menu toggle */}
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="cursor-pointer lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
                    </label>

                    {/* Breadcrumbs */}
                    <Breadcrumbs />

                    {/* Right section */}
                    <div className="ml-auto flex items-center gap-3">
                        {/* Global search */}
                        <button
                            type="button"
                            className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white sm:flex"
                            aria-label="Search"
                        >
                            <Search className="h-3.5 w-3.5" />
                            <span className="text-xs">Search...</span>
                            <kbd className="ml-2 inline-flex h-5 items-center rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 font-mono text-[10px] text-slate-500">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Quick create */}
                        <Link
                            href="/events/new"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
                            style={{
                                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                                border: "1px solid rgba(99,102,241,0.3)",
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            <span className="hidden sm:inline">Create Event</span>
                            <span className="sm:hidden">New</span>
                        </Link>

                        {/* User avatar */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/[0.08]"
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            }}
                        >
                            {initial}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
