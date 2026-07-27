"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, type ScannerSession } from "@/lib/session";

export default function HomePage() {
    const router = useRouter();
    const [activeSession, setActiveSession] = useState<ScannerSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = loadSession();
        if (session) {
            setActiveSession(session);
            if (!session.gate) {
                router.replace("/gate");
                return;
            }
            router.replace("/scan");
            return;
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <main className="min-h-dvh bg-[#090d16] flex items-center justify-center p-6 text-zinc-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium tracking-wide">Loading scanner environment…</span>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Brand */}
            <header className="pt-4 flex items-center justify-between z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Qrezo Scanner
                </div>
                <span className="text-xs text-zinc-500 font-mono">v1.1.0</span>
            </header>

            {/* Main Content */}
            <div className="my-auto py-8 text-center z-10 flex flex-col items-center">
                {/* Hero Icon */}
                <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-b from-blue-500/20 to-blue-600/5 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-900/20">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
                    Fast Event Check-In
                </h1>
                <p className="mt-3 text-zinc-400 text-sm leading-relaxed max-w-xs">
                    Turn any device into an enterprise gate scanner in seconds. Built for high-throughput entry.
                </p>

                {/* Active Session Card if present */}
                {activeSession ? (
                    <div className="mt-6 w-full p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-left">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                            <span className="font-semibold text-emerald-400 uppercase tracking-wider">Active Device Session</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">Paired</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{activeSession.eventName}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Gate: <span className="text-zinc-200 font-medium">{activeSession.gate || "Not selected"}</span></p>

                        <Link
                            href="/scan"
                            className="mt-3 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                        >
                            Resume Scanning
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="mt-8 w-full flex flex-col gap-3">
                    <Link
                        href="/pair"
                        className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[52px]"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Pair Scanner
                    </Link>

                    <Link
                        href="/login"
                        className="w-full py-3.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[52px]"
                    >
                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Staff Login
                    </Link>
                </div>
            </div>

            {/* Footer Information */}
            <footer className="pt-4 border-t border-zinc-900 text-center z-10">
                <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    PWA Ready • Encrypted Validation Proxy
                </p>
            </footer>
        </main>
    );
}

