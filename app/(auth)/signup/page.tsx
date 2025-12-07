"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { QrCode, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // 1. Register User
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong.");
                setLoading(false);
                return;
            }

            // 2. Auto-Login
            const loginRes = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (loginRes?.error) {
                setError("Account created, but auto-login failed. Please sign in.");
                setLoading(false);
                router.push("/login");
            } else {
                router.push("/dashboard");
                router.refresh();
            }

        } catch (err) {
            setError("An unexpected error occurred.");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white p-8 shadow-xl md:p-10">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600 mb-6">
                        <QrCode className="h-8 w-8" />
                        <span>QRify</span>
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Get started today</h2>
                    <p className="mt-2 text-sm text-slate-500">Create a new account for free</p>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                    placeholder="Create a password"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                            <div className="relative">
                                <CheckCircle2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-center text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Account
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
