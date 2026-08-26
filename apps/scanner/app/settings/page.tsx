"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    apiGet,
    apiPost,
    isUnpairedError,
    toLocalSession,
    type PlatformSessionData,
} from "@/lib/api";
import {
    APP_VERSION,
    clearSession,
    loadSession,
    type ScannerSession,
} from "@/lib/session";

export default function SettingsPage() {
    const router = useRouter();
    const [session, setSession] = useState<ScannerSession | null>(null);
    const [online, setOnline] = useState(true);
    const [connection, setConnection] = useState("Checking...");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const s = loadSession();
        if (!s) {
            router.replace("/");
            return;
        }
        setSession(s);

        let cancelled = false;
        (async () => {
            if (!navigator.onLine) {
                setConnection("Offline");
                return;
            }
            try {
                const data = await apiGet<PlatformSessionData>(
                    "scanner/me",
                    { scannerToken: s.token }
                );
                if (cancelled) return;
                const next = toLocalSession(data);
                setSession(next);
                const { saveSession } = await import("@/lib/session");
                saveSession(next);
                setConnection(data.device.status || "ONLINE");
            } catch (e) {
                if (cancelled) return;
                if (isUnpairedError(e)) {
                    clearSession();
                    setError("This scanner is no longer paired.");
                    setConnection("Unpaired");
                    return;
                }
                setConnection("Error");
                setError(e instanceof Error ? e.message : "Connection error");
            }
        })();

        return () => { cancelled = true; };
    }, [router]);

    useEffect(() => {
        const sync = () => setOnline(navigator.onLine);
        sync();
        window.addEventListener("online", sync);
        window.addEventListener("offline", sync);
        return () => {
            window.removeEventListener("online", sync);
            window.removeEventListener("offline", sync);
        };
    }, []);

    async function reconnect() {
        if (!session) return;
        setBusy(true);
        setError("");
        try {
            await apiPost(
                "scanner/heartbeat",
                { appVersion: APP_VERSION },
                { scannerToken: session.token }
            );
            setConnection("ONLINE");
        } catch (e) {
            if (isUnpairedError(e)) {
                clearSession();
                setError("This scanner is no longer paired.");
            } else {
                setError(e instanceof Error ? e.message : "Reconnect failed");
            }
        } finally {
            setBusy(false);
        }
    }

    async function unpair() {
        if (!session) return;
        if (!confirm("Unpair this device? You will need a new pairing code to reconnect.")) {
            return;
        }
        setBusy(true);
        try {
            await apiPost("scanner/unpair", {}, { scannerToken: session.token });
        } catch {
            // clear locally even if remote fails
        }
        clearSession();
        router.replace("/");
    }

    if (!session) {
        return (
            <main className="min-h-dvh bg-[#050a10] flex items-center justify-center p-6">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
                </div>
            </main>
        );
    }

    if (error === "This scanner is no longer paired.") {
        return (
            <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between p-6 max-w-md mx-auto text-center relative">
                <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />
                <div className="my-auto py-8 relative z-10" style={{ animation: "scale-in 0.3s ease" }}>
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">Scanner Unpaired</h1>
                    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">Device session invalidated.</p>
                    <button
                        type="button"
                        onClick={() => router.replace("/pair")}
                        className="mt-6 w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm btn-tactical shadow-lg shadow-emerald-600/20"
                    >
                        Re-Pair Device
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between p-5 max-w-md mx-auto relative">
            <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="py-2 border-b border-slate-800/60 flex items-center justify-between relative z-10" style={{ animation: "fade-in 0.4s ease" }}>
                <button
                    type="button"
                    onClick={() => router.push("/scan")}
                    className="p-2 -ml-2 text-slate-400 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Camera
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Device Settings</span>
            </header>

            {/* Settings */}
            <div className="my-auto py-4 space-y-4 relative z-10">

                {/* Current Assignment */}
                <div className="rounded-2xl border border-slate-800/60 overflow-hidden" style={{ background: "rgba(13,21,32,0.6)", animation: "slide-in-up 0.4s ease 0.1s both" }}>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/40">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Current Assignment</span>
                        <button
                            type="button"
                            onClick={() => router.push("/gate")}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                        >
                            Change Gate
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            { label: "Event", value: session.eventName },
                            { label: "Workspace", value: session.workspaceName },
                        ].map((row) => (
                            <div key={row.label} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{row.label}</span>
                                <span className="font-bold text-white truncate max-w-[200px]">{row.value}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Active Gate</span>
                            <span className="px-2.5 py-1 rounded-lg text-emerald-400 font-bold text-xs border border-emerald-500/20 font-mono"
                                style={{ background: "rgba(16,185,129,0.08)" }}>
                                {session.gate || "None"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Device Hardware */}
                <div className="rounded-2xl border border-slate-800/60 overflow-hidden" style={{ background: "rgba(13,21,32,0.6)", animation: "slide-in-up 0.4s ease 0.2s both" }}>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/40">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Device Hardware</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />
                            <span className="text-xs text-slate-400 font-bold">{online ? connection : "Offline"}</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Device Name</span>
                            <span className="font-bold text-white truncate max-w-[200px]">{session.deviceName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Device ID</span>
                            <span className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">{session.deviceId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Battery</span>
                            <span className="text-xs text-emerald-400 font-bold font-mono">98% OK</span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                        {error}
                    </div>
                ) : null}

                {/* Actions */}
                <div className="space-y-2.5" style={{ animation: "slide-in-up 0.4s ease 0.3s both" }}>
                    <button
                        type="button"
                        disabled={busy || !online}
                        onClick={reconnect}
                        className="w-full py-3 px-4 rounded-xl text-slate-200 text-sm font-bold flex items-center justify-center gap-2 btn-tactical border border-slate-800/80 min-h-[48px]"
                        style={{ background: "rgba(13,21,32,0.6)" }}
                    >
                        <svg className={`w-4 h-4 text-slate-400 ${busy ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Test Connection
                    </button>

                    <button
                        type="button"
                        disabled={busy}
                        onClick={unpair}
                        className="w-full py-3 px-4 rounded-xl text-rose-400 text-sm font-bold flex items-center justify-center gap-2 btn-tactical border border-rose-500/20 min-h-[48px]"
                        style={{ background: "rgba(239,68,68,0.06)" }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Unpair Scanner
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-2 text-center text-[10px] text-slate-600 font-mono relative z-10">
                Qrezo Scanner v{APP_VERSION} · PWA Mode
            </footer>
        </main>
    );
}
