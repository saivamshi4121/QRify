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

/**
 * Server-rendered chrome. Mobile open/close uses a CSS checkbox peer so there
 * is no client useState for the sidebar (avoids Turbopack SSR/HMR hydration
 * mismatches on the whole layout tree).
 */
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
        <div className="min-h-screen bg-slate-50">
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
                className="pointer-events-none fixed inset-0 z-40 bg-slate-900/60 opacity-0 backdrop-blur-sm transition-opacity peer-checked/sidebar:pointer-events-auto peer-checked/sidebar:opacity-100 lg:hidden"
                aria-label="Close menu"
            />

            {/* ── Sidebar ── */}
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[240px] -translate-x-full flex-col bg-[#0f1117] text-white transition-transform duration-200 peer-checked/sidebar:translate-x-0 lg:translate-x-0">
                {/* Logo */}
                <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                        <QrCode className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight text-white">
                        Qrezo
                    </span>
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="ml-auto cursor-pointer lg:hidden"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </label>
                </div>

                {/* Workspace pill */}
                <div className="border-b border-white/[0.06] px-3 py-2.5">
                    <WorkspaceSwitcher variant="sidebar" />
                </div>

                {/* Navigation */}
                <DashboardNav />

                {/* User Footer */}
                <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
                            {initial}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium leading-tight text-white">
                                {user.name}
                            </p>
                            <p className="text-xs capitalize text-slate-500">
                                {plan} plan
                            </p>
                        </div>
                    </div>
                    <DashboardSignOutButton />
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="lg:pl-[240px]">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
                    {/* Mobile menu toggle */}
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="cursor-pointer lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-slate-500" />
                    </label>

                    {/* Breadcrumbs */}
                    <Breadcrumbs />

                    {/* Right section */}
                    <div className="ml-auto flex items-center gap-2">
                        {/* Global search (decorative trigger) */}
                        <button
                            type="button"
                            className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 sm:flex"
                            aria-label="Search"
                        >
                            <Search className="h-3.5 w-3.5" />
                            <span className="text-xs">Search…</span>
                            <kbd className="ml-2 inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] text-slate-400">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Quick create */}
                        <Link
                            href="/events/new"
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            <span className="hidden sm:inline">Create Event</span>
                            <span className="sm:hidden">New</span>
                        </Link>

                        {/* User avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 ring-2 ring-white">
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
