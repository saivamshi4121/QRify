import { QrCode, Menu, X, User } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { DashboardNav } from "./DashboardNav";
import { DashboardSignOutButton } from "./DashboardSignOutButton";

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
    const initial = (user.name || "U").charAt(0);
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
                className="pointer-events-none fixed inset-0 z-40 bg-slate-900/50 opacity-0 backdrop-blur-sm transition-opacity peer-checked/sidebar:pointer-events-auto peer-checked/sidebar:opacity-100 lg:hidden"
                aria-label="Close menu"
            />

            <aside
                className="fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col bg-slate-900 text-white transition-transform duration-200 peer-checked/sidebar:translate-x-0 lg:translate-x-0"
            >
                <div className="flex h-16 items-center border-b border-slate-800 px-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <QrCode className="h-6 w-6 text-indigo-400" aria-hidden />
                        Qrezo
                    </div>
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="ml-auto cursor-pointer lg:hidden"
                        aria-label="Close menu"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </label>
                </div>

                <DashboardNav />

                <div className="mt-auto border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white">
                            {initial}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-white">
                                {user.name}
                            </p>
                            <p className="text-xs capitalize text-slate-400">
                                {plan} Plan
                            </p>
                        </div>
                    </div>
                    <DashboardSignOutButton />
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
                    <label
                        htmlFor="dashboard-sidebar-toggle"
                        className="cursor-pointer lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-slate-500" />
                    </label>

                    <div className="ml-auto flex items-center gap-4">
                        <WorkspaceSwitcher />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <User className="h-5 w-5" aria-hidden />
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl p-4 md:p-8 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
