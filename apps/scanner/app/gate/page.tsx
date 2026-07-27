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
            <main className="min-h-dvh bg-[#090d16] flex items-center justify-center p-6 text-zinc-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading session info…</span>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-5 max-w-md mx-auto">
            {/* Header */}
            <header className="py-2 border-b border-zinc-900 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Gate Setup</span>
                    <h1 className="text-xl font-bold text-white tracking-tight">Select Access Gate</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-300 truncate max-w-[140px]">{session.eventName}</p>
                    <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">{session.workspaceName}</p>
                </div>
            </header>

            {/* Content */}
            <div className="my-auto py-6">
                <p className="text-xs text-zinc-400 mb-4 uppercase tracking-wider font-semibold">
                    Standard Entry Points
                </p>

                {error ? (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                ) : null}

                {/* Gates Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {DEFAULT_GATES.map((g) => {
                        const isSelected = session.gate === g;
                        return (
                            <button
                                key={g}
                                type="button"
                                disabled={busy}
                                onClick={() => choose(g)}
                                className={`p-4 rounded-xl border text-left font-semibold transition-all min-h-[64px] flex flex-col justify-between active:scale-[0.98] ${
                                    isSelected
                                        ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                                        : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-200"
                                }`}
                            >
                                <span className="text-xs font-mono text-zinc-500 uppercase">Gate</span>
                                <span className="text-base font-bold truncate">{g}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Gate Entry */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Custom Gate Name
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={custom}
                            onChange={(e) => setCustom(e.target.value)}
                            placeholder="e.g. North Gate A"
                            disabled={busy}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="button"
                            disabled={busy || !custom.trim()}
                            onClick={() => choose(custom)}
                            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-sm transition-all shrink-0"
                        >
                            Set Gate
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-2 text-center text-xs text-zinc-500">
                You can change the gate at any time from Scanner Settings.
            </footer>
        </main>
    );
}

