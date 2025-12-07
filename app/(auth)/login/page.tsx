"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { QrCode, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectUrl = searchParams.get("redirect") || "/dashboard";
    // Append action param to redirect if it exists
    const action = searchParams.get("action");
    const fullRedirectUrl = action ? `${redirectUrl}?action=${action}` : redirectUrl;

    useEffect(() => {
        if (status === "authenticated") {
            router.replace(fullRedirectUrl);
        }
    }, [status, router, fullRedirectUrl]);

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
            } else {
                router.push(fullRedirectUrl);
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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                    <p className="mt-2 text-sm text-slate-500">Sign in to your account to continue</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => signIn("google", { callbackUrl: fullRedirectUrl })}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        {/* Google SVG Icon */}
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <path
                                d="M12.0003 20.45c4.656 0 8.169-3.219 8.169-8.169 0-.669-.069-1.319-.188-1.938H12.0003v3.719h4.632c-.225 1.344-1.344 3.031-4.632 3.031-2.813 0-5.119-2.313-5.119-5.119s2.306-5.119 5.119-5.119c1.294 0 2.444.469 3.35 1.319l2.769-2.763c-1.788-1.669-4.138-2.606-6.119-2.606-5.063 0-9.188 4.125-9.188 9.188s4.125 9.188 9.188 9.188z"
                                fill="#4285F4"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                    placeholder="Enter your password"
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
                            Sign in
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500">
                    Not a member?{" "}
                    <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                        Start a free trial
                    </Link>
                </p>
            </div>
        </div>
    );
}
