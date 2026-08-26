"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch, type PlatformSessionData, toLocalSession } from "@/lib/api";
import {
    DEFAULT_GATES,
    loadSession,
    saveSession,
    type ScannerSession,
} from "@/lib/session";

export default function GatePage() {
    const router = useRouter();
    const [session, setSession] = useState<ScannerSession | null>(null);
    const [custom, setCustom] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const s = loadSession();
        if (!s) {
            router.replace("/");
            return;
        }
        setSession(s);
    }, [router]);

    async function choose(gate: string) {
        if (!session || !gate.trim()) return;
        setBusy(true);
        setError("");
        try {
            const data = await apiPatch<PlatformSessionData>(
                "scanner/gate",
                { gate: gate.trim() },
                { scannerToken: session.token }
            );
            saveSession(toLocalSession(data));
            router.replace("/scan");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to set gate");
            setBusy(false);
        }
    }

    if (!session) {
        return (
            <main className="min-h-dvh bg-[#050a10] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 tracking-wide">LOADING</span>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between p-5 max-w-md mx-auto relative">
            <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="py-2 border-b border-slate-800/60 flex items-center justify-between relative z-10" style={{ animation: "fade-in 0.4s ease" }}>
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Gate Setup</span>
                    <h1 className="text-xl font-extrabold text-white tracking-tight">Select Access Point</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-white truncate max-w-[140px]">{session.eventName}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px] font-mono">{session.workspaceName}</p>
                </div>
            </header>

            {/* Content */}
            <div className="my-auto py-6 relative z-10">
                <p className="text-[11px] text-slate-500 mb-4 uppercase tracking-widest font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Standard Entry Points
                </p>

                {error ? (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                        {error}
                    </div>
                ) : null}

                {/* Gates Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6" style={{ animation: "slide-in-up 0.5s ease 0.1s both" }}>
                    {DEFAULT_GATES.map((g) => {
                        const isSelected = session.gate === g;
                        return (
                            <button
                                key={g}
                                type="button"
                                disabled={busy}
                                onClick={() => choose(g)}
                                className={`p-4 rounded-xl border text-left font-bold transition-all min-h-[68px] flex flex-col justify-between btn-tactical ${
                                    isSelected
                                        ? "border-emerald-500/50 text-white"
                                        : "border-slate-800/80 text-slate-200 hover:border-slate-700"
                                }`}
                                style={{
                                    background: isSelected
                                        ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))"
                                        : "rgba(13,21,32,0.6)",
                                    boxShadow: isSelected ? "0 0 20px rgba(16,185,129,0.1)" : "none",
                                }}
                            >
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Gate</span>
                                <span className="text-base font-extrabold truncate">{g}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Gate */}
                <div className="p-4 rounded-xl border border-slate-800/60" style={{ background: "rgba(13,21,32,0.5)", animation: "slide-in-up 0.5s ease 0.2s both" }}>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Custom Gate Name
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={custom}
                            onChange={(e) => setCustom(e.target.value)}
                            placeholder="e.g. North Gate A"
                            disabled={busy}
                            className="flex-1 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                            style={{
                                background: "rgba(5,10,16,0.8)",
                                border: "1px solid rgba(16,185,129,0.15)",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.15)")}
                        />
                        <button
                            type="button"
                            disabled={busy || !custom.trim()}
                            onClick={() => choose(custom)}
                            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm btn-tactical transition-all shrink-0"
                        >
                            Set
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-2 text-center text-[11px] text-slate-600 relative z-10">
                Gate can be changed anytime from Scanner Settings.
            </footer>
        </main>
    );
}
