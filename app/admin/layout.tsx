"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, QrCode, LayoutDashboard, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    const handleLogout = async () => {
        await signOut({
            callbackUrl: "/login",
            redirect: true,
        });
    };

    // Redirect to admin login if not admin (skip for login page)
    useEffect(() => {
        // Skip redirect logic for login page
        if (pathname === "/admin/login") {
            return;
        }
        
        if (status === "unauthenticated") {
            router.push("/admin/login");
        } else if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/dashboard");
        }
    }, [status, session, router, pathname]);

    // Skip layout for login page - let it render without restrictions
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    // Show loading while checking authentication
    if (status === "loading" || (status === "authenticated" && session?.user?.role !== "admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated or not admin
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
        return null;
    }

    const navItems = [
        { name: "User Management", href: "/admin/users", icon: Users },
        { name: "QR Oversight", href: "/admin/qrs", icon: QrCode },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="font-bold text-xl flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-400" /> Admin
                    </span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                                    isActive
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        <LayoutDashboard className="h-4 w-4" /> Exit to App
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between">
                    <h1 className="text-lg font-semibold text-slate-800">Admin Console</h1>
                    <div className="text-sm text-slate-500">Super Admin Access</div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
