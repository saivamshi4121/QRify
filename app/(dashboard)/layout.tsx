"use client";

/**
 * Dashboard shell. Nav is always rendered the same on server and client
 * (static NAV_ITEMS) to avoid Turbopack HMR hydration mismatches.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    QrCode,
    Settings,
    Menu,
    X,
    User,
    LogOut,
    PlusCircle,
    MessageSquare,
    FileText,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "My QRs", href: "/qrs", icon: QrCode },
    { name: "Review Pages", href: "/smart-pages", icon: FileText },
    { name: "Feedback", href: "/feedback", icon: MessageSquare },
    { name: "Create QR", href: "/create", icon: PlusCircle },
    { name: "Settings", href: "/settings", icon: Settings },
] as const;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const handleLogout = async () => {
        await signOut({
            callbackUrl: "/login",
            redirect: true,
        });
    };

    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Keep SSR and first client paint identical for session-dependent UI
    const userName = mounted && session?.user?.name ? session.user.name : "User";
    const userInitial = userName.charAt(0);
    const planLabel =
        mounted && session?.user?.subscriptionPlan
            ? session.user.subscriptionPlan
            : "Free";

    return (
        <div className="min-h-screen bg-slate-50">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center border-b border-slate-800 px-6">
                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                        <QrCode className="h-6 w-6 text-indigo-400" />
                        <span>Qrezo</span>
                    </div>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        type="button"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-6">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-400 group-hover:text-white"
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white font-semibold">
                            {userInitial}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">
                                {planLabel} Plan
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
                    <button
                        type="button"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6 text-slate-500" />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <WorkspaceSwitcher />
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
