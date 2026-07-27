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
    const [connection, setConnection] = useState("Checking…");
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

        return () => {
            cancelled = true;
        };
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
            <main className="min-h-dvh bg-[#090d16] flex items-center justify-center p-6 text-zinc-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading settings…</span>
                </div>
            </main>
        );
    }

    if (error === "This scanner is no longer paired.") {
        return (
            <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-6 max-w-md mx-auto text-center">
                <div className="my-auto py-8">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Scanner Unpaired</h1>
                    <p className="mt-2 text-sm text-zinc-400 max-w-xs mx-auto">
                        This scanner device was un-paired by an event manager or the session expired.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.replace("/pair")}
                        className="mt-6 w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
                    >
                        Pair Device Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-5 max-w-md mx-auto">
            {/* Header */}
            <header className="py-2 border-b border-zinc-900 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.push("/scan")}
                    className="p-2 -ml-2 text-zinc-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Camera
                </button>
                <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Device Settings</span>
                </div>
            </header>

            {/* Scrollable Settings List */}
            <div className="my-auto py-4 space-y-5">

                {/* Section 1: Active Event & Gate */}
                <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Current Assignment</span>
                        <button
                            type="button"
                            onClick={() => router.push("/gate")}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                        >
                            Change Gate
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Event</span>
                            <span className="font-semibold text-white truncate max-w-[200px]">{session.eventName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Workspace</span>
                            <span className="font-medium text-zinc-300 truncate max-w-[200px]">{session.workspaceName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Active Gate</span>
                            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-xs">
                                {session.gate || "Not selected"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Device Hardware & Network */}
                <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Device Hardware</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />
                            <span className="text-xs text-zinc-400 font-medium">{online ? connection : "Offline"}</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Device Name</span>
                            <span className="font-medium text-white truncate max-w-[200px]">{session.deviceName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Device ID</span>
                            <span className="font-mono text-xs text-zinc-400 truncate max-w-[160px]">{session.deviceId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Battery Status</span>
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                98% Normal
                            </span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
                        {error}
                    </div>
                ) : null}

                {/* Section 3: Actions */}
                <div className="space-y-2.5">
                    <button
                        type="button"
                        disabled={busy || !online}
                        onClick={reconnect}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        <svg className={`w-4 h-4 text-zinc-400 ${busy ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Test Connection / Reconnect
                    </button>

                    <button
                        type="button"
                        disabled={busy}
                        onClick={unpair}
                        className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Unpair Scanner Device
                    </button>
                </div>
            </div>

            {/* Version Footer */}
            <footer className="py-2 text-center text-xs text-zinc-600 font-mono">
                Qrezo Scanner App v{APP_VERSION} • PWA Mode
            </footer>
        </main>
    );
}

