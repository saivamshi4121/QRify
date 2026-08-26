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
            <main className="min-h-dvh bg-[#050a10] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-emerald-400 tracking-wide">INITIALIZING</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">Loading scanner environment</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between relative overflow-hidden">
            {/* HUD Grid Background */}
            <div className="absolute inset-0 hud-grid opacity-40 pointer-events-none" />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 65%)" }} />

            <div className="relative z-10 flex flex-col flex-1 p-5 max-w-md mx-auto w-full">
                {/* Top Bar */}
                <header className="pt-2 pb-4 flex items-center justify-between" style={{ animation: "fade-in 0.6s ease" }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-widest"
                        style={{ background: "rgba(16,185,129,0.08)" }}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        QREZO SCANNER
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">v2.0</span>
                </header>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center py-8" style={{ animation: "slide-in-up 0.7s ease" }}>
                    {/* Tactical Crosshair */}
                    <div className="relative w-28 h-28 mb-8">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" style={{ animation: "corner-glow 3s ease-in-out infinite" }} />
                        {/* Middle ring */}
                        <div className="absolute inset-3 rounded-full border border-emerald-500/15" />
                        {/* Inner ring */}
                        <div className="absolute inset-6 rounded-full border border-emerald-500/10" />
                        {/* Center glow */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(34,211,238,0.1))",
                                    boxShadow: "0 0 30px rgba(16,185,129,0.2)",
                                }}>
                                <div className="w-5 h-5 rounded-full bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                        {/* Crosshair lines */}
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent -translate-y-1/2" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent -translate-x-1/2" />
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400/60 rounded-tl" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400/60 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400/60 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400/60 rounded-br" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight text-center">
                        High-Speed Event
                        <br />
                        <span className="text-emerald-400" style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}>Check-In System</span>
                    </h1>
                    <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-xs text-center">
                        Enterprise-grade QR validation with sub-second response times and offline fallback reliability.
                    </p>

                    {/* Active Session Card */}
                    {activeSession ? (
                        <div className="mt-8 w-full p-4 rounded-xl glass-card" style={{ animation: "slide-in-up 0.5s ease 0.2s both" }}>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                                <span className="font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Active Session
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">PAIRED</span>
                            </div>
                            <p className="text-sm font-bold text-white truncate">{activeSession.eventName}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono">Gate: {activeSession.gate || "Not selected"}</p>
                            <Link
                                href="/scan"
                                className="mt-3 w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 btn-tactical shadow-lg shadow-emerald-600/20"
                            >
                                Resume Scanning
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="mt-8 w-full flex flex-col gap-3" style={{ animation: "slide-in-up 0.7s ease 0.3s both" }}>
                        <Link
                            href="/pair"
                            className="w-full py-4 px-5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-3 btn-tactical min-h-[56px] relative overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #059669, #0d9488)",
                                boxShadow: "0 0 30px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                        >
                            {/* Scan sweep effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    style={{ animation: "scan-sweep 3s linear infinite" }} />
                            </div>
                            <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <span className="relative z-10">Pair Scanner Device</span>
                        </Link>

                        <Link
                            href="/login"
                            className="w-full py-4 px-5 rounded-xl bg-[#0d1520] hover:bg-[#111c2a] text-slate-300 border border-slate-800/80 font-bold text-sm flex items-center justify-center gap-3 btn-tactical min-h-[56px] transition-all"
                        >
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Staff Login
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-3 border-t border-slate-900/60 text-center" style={{ animation: "fade-in 0.8s ease 0.5s both" }}>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
                            PWA READY
                        </span>
                        <span className="text-slate-800">|</span>
                        <span>ENCRYPTED</span>
                        <span className="text-slate-800">|</span>
                        <span>OFFLINE QUEUE</span>
                    </div>
                </footer>
            </div>
        </main>
    );
}
