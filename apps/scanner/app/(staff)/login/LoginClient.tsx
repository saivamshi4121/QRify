"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
    const router = useRouter();
    const search = useSearchParams();
    const callbackUrl = search.get("callbackUrl") || "/setup";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password. Check credentials.");
            return;
        }
        router.replace(callbackUrl);
    }

    return (
        <main className="min-h-dvh bg-[#050a10] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />

            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)" }} />

            <div className="w-full max-w-sm relative z-10" style={{ animation: "slide-in-up 0.6s ease" }}>
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-3"
                        style={{ background: "rgba(16,185,129,0.08)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Organizer Portal
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Staff Sign In</h1>
                    <p className="mt-2 text-xs text-slate-400">
                        Sign in with your Qrezo organizer credentials.
                    </p>
                </div>

                {/* Form */}
                <div className="p-6 rounded-2xl shadow-2xl" style={{ background: "rgba(13,21,32,0.8)", border: "1px solid rgba(16,185,129,0.12)", backdropFilter: "blur(20px)" }}>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                Account Email
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="organizer@qrezo.com"
                                className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                                style={{ background: "rgba(5,10,16,0.8)", border: "1px solid rgba(16,185,129,0.15)" }}
                                onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
                                onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.15)")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                                style={{ background: "rgba(5,10,16,0.8)", border: "1px solid rgba(16,185,129,0.15)" }}
                                onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
                                onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.15)")}
                            />
                        </div>

                        {error ? (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm btn-tactical shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 min-h-[48px]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In to Continue</span>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-xs text-slate-500 hover:text-slate-300 font-bold inline-flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Return to Scanner Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
