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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scanningQr]);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        void completePairing(code);
    }

    // Helper to render individual digit slots
    const digits = Array.from({ length: 6 }, (_, i) => code[i] || "");

    return (
        <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-5 max-w-md mx-auto relative">
            {/* Header */}
            <header className="flex items-center justify-between py-2 border-b border-zinc-900">
                <Link
                    href="/"
                    className="p-2 -ml-2 text-zinc-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Device Pairing</span>
                </div>
            </header>

            {/* Main Area */}
            <div className="my-auto py-6">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Pair Scanner Device
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400 max-w-xs mx-auto">
                        Ask an event manager for the 6-digit code from Dashboard → Scanner Devices, or scan the pairing QR code.
                    </p>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setScanningQr(false)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                            !scanningQr
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-zinc-400 hover:text-white"
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
                        className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                            scanningQr
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        Scan QR Code
                    </button>
                </div>

                {!scanningQr ? (
                    <form onSubmit={onSubmit} className="flex flex-col items-center">
                        {/* Hidden native input for soft keyboard trigger */}
                        <div className="relative w-full max-w-xs mb-4">
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

                            {/* Digit Boxes Display */}
                            <div className="grid grid-cols-6 gap-2 pointer-events-none">
                                {digits.map((digit, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-14 rounded-xl border flex items-center justify-center text-xl font-mono font-bold transition-all ${
                                            digit
                                                ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/20"
                                                : idx === code.length
                                                ? "bg-zinc-900 border-blue-500/80 animate-pulse text-transparent"
                                                : "bg-zinc-900/60 border-zinc-800 text-zinc-600"
                                        }`}
                                    >
                                        {digit || "•"}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error ? (
                            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full max-w-xs py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Pairing Device…</span>
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
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-xs aspect-square rounded-2xl bg-black border border-zinc-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
                            <div id={readerId} className="w-full h-full" />

                            {/* Viewfinder overlay */}
                            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/40 m-6 rounded-xl flex items-center justify-center">
                                <div className="w-full h-0.5 bg-blue-500/80 animate-laser absolute" />
                            </div>
                        </div>

                        {cameraError ? (
                            <p className="mt-3 text-xs text-rose-400 text-center font-medium">
                                {cameraError}
                            </p>
                        ) : (
                            <p className="mt-3 text-xs text-zinc-400 text-center">
                                Point camera at the pairing QR shown on Dashboard
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => setScanningQr(false)}
                            className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
                        >
                            Cancel Camera Scan
                        </button>
                    </div>
                )}
            </div>

            {/* Footer tip */}
            <footer className="py-2 text-center text-xs text-zinc-500">
                Paired devices automatically receive gate security credentials.
            </footer>
        </main>
    );
}

