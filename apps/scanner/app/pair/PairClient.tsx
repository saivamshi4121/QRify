"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    extractPairingCode,
    pairWithCode,
    toLocalSession,
} from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function PairClient() {
    const router = useRouter();
    const search = useSearchParams();
    const [code, setCode] = useState(search.get("code") || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [scanningQr, setScanningQr] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const scannerRef = useRef<{
        stop: () => Promise<void>;
        isScanning: boolean;
    } | null>(null);
    const pairingLock = useRef(false);
    const readerId = "pairing-qr-reader";

    async function completePairing(raw: string) {
        const pairingCode = extractPairingCode(raw);
        if (!pairingCode || pairingLock.current) return;
        pairingLock.current = true;
        setLoading(true);
        setError("");
        try {
            const data = await pairWithCode(pairingCode);
            const session = toLocalSession(data);
            saveSession(session);
            if (!session.gate) {
                router.replace("/gate");
            } else {
                router.replace("/scan");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Pairing failed. Check the 6-digit code.");
            pairingLock.current = false;
            setLoading(false);
        }
    }

    useEffect(() => {
        const initial = search.get("code");
        if (initial && /^\d{6}$/.test(initial)) {
            void completePairing(initial);
        }
    }, []);

    useEffect(() => {
        if (!scanningQr) return;
        let cancelled = false;

        async function start() {
            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                if (cancelled) return;
                const scanner = new Html5Qrcode(readerId, { verbose: false });
                scannerRef.current = scanner as unknown as typeof scannerRef.current;
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 8, qrbox: { width: 220, height: 220 } },
                    (text) => {
                        void completePairing(text);
                    },
                    () => undefined
                );
            } catch (e) {
                if (!cancelled) {
                    setCameraError(
                        e instanceof Error
                            ? e.message
                            : "Unable to open camera for pairing QR"
                    );
                    setScanningQr(false);
                }
            }
        }

        void start();
        return () => {
            cancelled = true;
            const s = scannerRef.current;
            scannerRef.current = null;
            if (s?.isScanning) void s.stop().catch(() => undefined);
        };
    }, [scanningQr]);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        void completePairing(code);
    }

    const digits = Array.from({ length: 6 }, (_, i) => code[i] || "");

    return (
        <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between p-5 max-w-md mx-auto relative">
            <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between py-2 border-b border-slate-800/60 relative z-10" style={{ animation: "fade-in 0.4s ease" }}>
                <Link
                    href="/"
                    className="p-2 -ml-2 text-slate-400 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Device Pairing</span>
                </div>
            </header>

            {/* Main */}
            <div className="my-auto py-6 relative z-10">
                <div className="text-center mb-6" style={{ animation: "slide-in-up 0.5s ease" }}>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Pair Scanner Device
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
                        Enter the 6-digit code from Dashboard or scan the pairing QR code.
                    </p>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 p-1 mb-6 rounded-xl border border-slate-800/80" style={{ background: "rgba(13,21,32,0.6)", animation: "slide-in-up 0.5s ease 0.1s both" }}>
                    <button
                        type="button"
                        onClick={() => setScanningQr(false)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                            !scanningQr
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Pair Code
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCameraError("");
                            setScanningQr(true);
                        }}
                        className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                            scanningQr
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Scan QR Code
                    </button>
                </div>

                {!scanningQr ? (
                    <form onSubmit={onSubmit} className="flex flex-col items-center" style={{ animation: "slide-in-up 0.5s ease 0.2s both" }}>
                        <div className="relative w-full max-w-xs mb-5">
                            <input
                                inputMode="numeric"
                                pattern="\d{6}"
                                maxLength={6}
                                value={code}
                                onChange={(e) =>
                                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                autoFocus
                                disabled={loading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 text-center"
                            />
                            <div className="grid grid-cols-6 gap-2 pointer-events-none">
                                {digits.map((digit, idx) => (
                                    <div
                                        key={idx}
                                        className="h-14 rounded-xl border flex items-center justify-center text-xl font-mono font-bold transition-all"
                                        style={{
                                            background: digit
                                                ? "rgba(16,185,129,0.08)"
                                                : idx === code.length
                                                ? "rgba(13,21,32,0.8)"
                                                : "rgba(5,10,16,0.5)",
                                            borderColor: digit
                                                ? "rgba(16,185,129,0.4)"
                                                : idx === code.length
                                                ? "rgba(16,185,129,0.3)"
                                                : "rgba(21,32,48,0.8)",
                                            color: digit ? "#34d399" : "#334155",
                                            boxShadow: digit ? "0 0 10px rgba(16,185,129,0.1)" : "none",
                                            animation: idx === code.length ? "h-border-pulse 1.5s ease-in-out infinite" : "none",
                                        }}
                                    >
                                        {digit || "·"}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error ? (
                            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full max-w-xs py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm btn-tactical shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 min-h-[52px]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Pairing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Complete Pairing</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center" style={{ animation: "scale-in 0.3s ease" }}>
                        <div className="w-full max-w-xs aspect-square rounded-2xl bg-black border border-slate-800/80 overflow-hidden relative shadow-2xl flex items-center justify-center">
                            <div id={readerId} className="w-full h-full" />
                            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-500/30 m-6 rounded-xl flex items-center justify-center">
                                <div className="w-full h-0.5 bg-emerald-500/60 animate-laser absolute" />
                            </div>
                        </div>

                        {cameraError ? (
                            <p className="mt-3 text-xs text-rose-400 text-center font-bold">{cameraError}</p>
                        ) : (
                            <p className="mt-3 text-xs text-slate-400 text-center">Point camera at pairing QR on Dashboard</p>
                        )}

                        <button
                            type="button"
                            onClick={() => setScanningQr(false)}
                            className="mt-4 px-4 py-2 rounded-lg border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                            style={{ background: "rgba(13,21,32,0.6)" }}
                        >
                            Cancel Camera
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-2 text-center text-[11px] text-slate-600 relative z-10">
                Paired devices receive gate security credentials.
            </footer>
        </main>
    );
}
