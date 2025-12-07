"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Shield, Mail, Lock, Loader2, AlertCircle, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If already authenticated and is admin, redirect to admin portal
        if (status === "authenticated" && session?.user?.role === "admin") {
            router.replace("/admin");
        }
    }, [status, session, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password.");
                setLoading(false);
                return;
            }

            // Wait for session to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if user is admin by fetching session
            const sessionRes = await fetch("/api/auth/session");
            const sessionData = await sessionRes.json();

            if (sessionData?.user?.role !== "admin") {
                setError("Access denied. This account does not have admin privileges.");
                setLoading(false);
                // Sign out the non-admin user
                await signOut({ redirect: false });
                return;
            }

            // Admin confirmed, redirect to admin portal
            router.push("/admin");
            router.refresh();
        } catch (err) {
            setError("An unexpected error occurred.");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 shadow-2xl md:p-10">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
                        <Shield className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Admin Portal</h2>
                    <p className="mt-2 text-sm text-slate-400">Sign in with admin credentials</p>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Signing in..." : "Sign in to Admin Portal"}
                        </button>
                    </form>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <Link 
                        href="/login" 
                        className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Regular User Login
                    </Link>
                </div>

                <div className="pt-2">
                    <p className="text-xs text-center text-slate-500">
                        Only users with admin privileges can access this portal
                    </p>
                </div>
            </div>
        </div>
    );
}

