"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    attendeeDisplayName,
    apiPost,
    extractTokenFromQr,
    isUnpairedError,
    resultTone,
    type ScanHistoryItem,
    type ValidateAccessData,
} from "@/lib/api";
import { APP_VERSION, type ScannerSession } from "@/lib/session";

const RESULT_DISPLAY_MS = 2200;

type Props = {
    session: ScannerSession;
    online: boolean;
};

export default function ScannerView({ session, online }: Props) {
    const router = useRouter();
    const [result, setResult] = useState<ValidateAccessData | null>(null);
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);
    const [cameraError, setCameraError] = useState("");
    const [scanning, setScanning] = useState(false);
    const [unpaired, setUnpaired] = useState(false);
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualTokenInput, setManualTokenInput] = useState("");
    const [torchOn, setTorchOn] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
    const [scanCount, setScanCount] = useState(0);

    const pendingRef = useRef(false);
    const lastTokenRef = useRef<string>("");
    const lastAtRef = useRef(0);
    const onlineRef = useRef(online);
    const sessionRef = useRef(session);
    const handleDecodeRef = useRef<(text: string) => void>(() => undefined);
    const scannerRef = useRef<{
        stop: () => Promise<void>;
        pause: (shouldPauseVideo?: boolean) => void;
        resume: () => void;
        isScanning: boolean;
    } | null>(null);
    const containerId = "qrezo-qr-reader";

    onlineRef.current = online;
    sessionRef.current = session;

    const pushHistory = useCallback((item: ScanHistoryItem) => {
        setHistory((prev) => [item, ...prev].slice(0, 50));
        setScanCount((c) => c + 1);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, []);

    useEffect(() => {
        if (!online || !session.token) return;
        const beat = () => {
            void apiPost(
                "scanner/heartbeat",
                { appVersion: APP_VERSION },
                { scannerToken: session.token }
            ).then(() => {
                setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }).catch((e) => {
                if (isUnpairedError(e)) setUnpaired(true);
            });
        };
        beat();
        const id = window.setInterval(beat, 45000);
        return () => window.clearInterval(id);
    }, [online, session.token]);

    const handleDecode = useCallback(
        async (decodedText: string) => {
            if (!onlineRef.current || pendingRef.current || unpaired) return;

            const token = extractTokenFromQr(decodedText);
            if (!token) return;

            const now = Date.now();
            if (
                token === lastTokenRef.current &&
                now - lastAtRef.current < 4000
            ) {
                return;
            }

            const sel = sessionRef.current;
            pendingRef.current = true;
            lastTokenRef.current = token;
            lastAtRef.current = now;

            try {
                scannerRef.current?.pause(true);
            } catch {
                // ignore
            }

            try {
                const data = await apiPost<ValidateAccessData>(
                    "scanner/access/validate",
                    { token, type: "ENTRY" },
                    { scannerToken: sel.token }
                );
                setResult(data);
                pushHistory({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    status: data.result,
                    time:
                        data.accessEvent?.occurredAt ||
                        new Date().toISOString(),
                    attendee: attendeeDisplayName(data.attendee),
                });
            } catch (e) {
                if (isUnpairedError(e)) {
                    setUnpaired(true);
                    pendingRef.current = false;
                    return;
                }
                const message =
                    e instanceof Error ? e.message : "Validation failed";
                const denied: ValidateAccessData = {
                    allowed: false,
                    result: "DENIED",
                    message,
                    attendee: null,
                    event: {
                        id: sel.eventId,
                        name: sel.eventName,
                        slug: "",
                        status: "",
                    },
                    accessEvent: {
                        gate: sel.gate,
                        occurredAt: new Date().toISOString(),
                        result: "DENIED",
                    },
                    previousEntryAt: null,
                };
                setResult(denied);
                pushHistory({
                    id: `${Date.now()}-err`,
                    status: "DENIED",
                    time: denied.accessEvent.occurredAt,
                    attendee: "—",
                });
            }

            window.setTimeout(() => {
                setResult(null);
                pendingRef.current = false;
                try {
                    scannerRef.current?.resume();
                } catch {
                    // ignore
                }
            }, RESULT_DISPLAY_MS);
        },
        [pushHistory, unpaired]
    );

    handleDecodeRef.current = (text: string) => {
        void handleDecode(text);
    };

    useEffect(() => {
        let cancelled = false;

        async function start() {
            if (!online || unpaired) {
                setScanning(false);
                return;
            }
            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                if (cancelled) return;
                const scanner = new Html5Qrcode(containerId, {
                    verbose: false,
                });
                scannerRef.current =
                    scanner as unknown as typeof scannerRef.current;
                await scanner.start(
                    { facingMode },
                    {
                        fps: 10,
                        qrbox: (w, h) => {
                            const side = Math.min(w, h) * 0.72;
                            return { width: side, height: side };
                        },
                        aspectRatio: 1,
                    },
                    (text) => {
                        handleDecodeRef.current(text);
                    },
                    () => undefined
                );
                if (!cancelled) setScanning(true);
            } catch (e) {
                if (!cancelled) {
                    setCameraError(
                        e instanceof Error
                            ? e.message
                            : "Unable to open camera"
                    );
                }
            }
        }

        void start();

        return () => {
            cancelled = true;
            const s = scannerRef.current;
            scannerRef.current = null;
            if (s?.isScanning) {
                void s.stop().catch(() => undefined);
            }
        };
    }, [online, unpaired, facingMode]);

    const toggleTorch = async () => {
        try {
            const videoElem = document.querySelector(`#${containerId} video`) as HTMLVideoElement;
            if (videoElem && videoElem.srcObject) {
                const stream = videoElem.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                if (track) {
                    const nextState = !torchOn;
                    await (track as any).applyConstraints({
                        advanced: [{ torch: nextState }]
                    });
                    setTorchOn(nextState);
                }
            }
        } catch {
            // Flashlight hardware unsupported
        }
    };

    const flipCamera = () => {
        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTokenInput.trim()) return;
        setManualModalOpen(false);
        void handleDecode(manualTokenInput.trim());
        setManualTokenInput("");
    };

    if (unpaired) {
        return (
            <main className="min-h-dvh bg-[#050a10] flex flex-col justify-between p-5 max-w-md mx-auto text-center relative">
                <div className="absolute inset-0 hud-grid opacity-20 pointer-events-none" />
                <div className="my-auto py-8 relative z-10" style={{ animation: "scale-in 0.3s ease" }}>
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-2 border-rose-500/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-rose-500/30" style={{ animation: "pulse-ring 2s ease-in-out infinite" }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Scanner Unpaired</h1>
                    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
                        Device session was invalidated. Re-pair to resume scanning operations.
                    </p>
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

    const tone = result ? resultTone(result.result) : null;

    return (
        <div className="min-h-dvh bg-[#050a10] max-w-md mx-auto flex flex-col justify-between relative overflow-hidden select-none">
            {/* Top Status Header */}
            <header className="px-4 py-3 flex items-center justify-between z-20 relative"
                style={{
                    background: "rgba(5,10,16,0.95)",
                    borderBottom: "1px solid rgba(16,185,129,0.15)",
                    backdropFilter: "blur(16px)",
                }}>
                <div className="flex items-center gap-3">
                    {/* Live pulse */}
                    <div className="flex items-center gap-2">
                        <span className={`status-dot w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-400 ok" : "bg-rose-500 offline"}`} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                            {online ? "LIVE" : "OFFLINE"}
                        </span>
                    </div>

                    <div className="h-5 w-px bg-emerald-500/20" />

                    <div>
                        <p className="text-xs font-bold text-white leading-tight truncate max-w-[160px]">
                            {session.gate || "Gate"} · {session.eventName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                            {session.deviceName} · {lastSyncTime}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Scan counter */}
                    {scanCount > 0 && (
                        <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20"
                            style={{ background: "rgba(16,185,129,0.08)" }}>
                            {scanCount} scans
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => router.push("/settings")}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-800/80"
                        style={{ background: "rgba(13,21,32,0.8)" }}
                        title="Settings"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Offline Alert */}
            {!online ? (
                <div className="px-4 py-2.5 text-amber-400 text-xs font-bold text-center flex items-center justify-center gap-2 z-20"
                    style={{
                        background: "rgba(245,158,11,0.08)",
                        borderBottom: "1px solid rgba(245,158,11,0.15)",
                    }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m1.414 1.414a7 7 0 000 9.9m9.9 0a7 7 0 000-9.9M9.879 9.879a3 3 0 014.242 0M9.88 9.88l4.24 4.24" />
                    </svg>
                    OFFLINE — Scanning paused
                </div>
            ) : null}

            {/* Camera Viewfinder */}
            <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
                <div id={containerId} className="w-full h-full object-cover" />

                {/* Viewfinder Overlay */}
                {online && scanning && !result ? (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6" style={{ animation: "fade-in 0.3s ease" }}>
                        {/* Reticle */}
                        <div className="relative w-64 h-64">
                            {/* Outer border */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.2)]" />

                            {/* Corner brackets */}
                            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" style={{ animation: "corner-glow 2s ease-in-out infinite" }} />
                            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" style={{ animation: "corner-glow 2s ease-in-out infinite 0.5s" }} />
                            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" style={{ animation: "corner-glow 2s ease-in-out infinite 1s" }} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" style={{ animation: "corner-glow 2s ease-in-out infinite 1.5s" }} />

                            {/* Laser sweep */}
                            <div className="w-[85%] h-[2px] mx-auto bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-laser absolute left-1/2 -translate-x-1/2" />

                            {/* Center crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full border-2 border-emerald-400/50" />
                            </div>
                        </div>

                        {/* Instruction pill */}
                        <div className="mt-5 px-5 py-2 rounded-full text-xs font-bold text-white/90 tracking-wide flex items-center gap-2"
                            style={{
                                background: "rgba(5,10,16,0.85)",
                                border: "1px solid rgba(16,185,129,0.2)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Align QR code within frame
                        </div>
                    </div>
                ) : null}

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-0 right-0 px-5 flex items-center justify-center gap-3 z-20">
                    {/* Torch */}
                    <button
                        type="button"
                        onClick={toggleTorch}
                        className={`w-12 h-12 rounded-full flex items-center justify-center btn-tactical transition-all ${
                            torchOn
                                ? "bg-amber-500 border-2 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                : "border border-white/20 text-white"
                        }`}
                        style={!torchOn ? { background: "rgba(5,10,16,0.7)", backdropFilter: "blur(12px)" } : {}}
                        title="Toggle Flashlight"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>

                    {/* Manual Entry */}
                    <button
                        type="button"
                        onClick={() => setManualModalOpen(true)}
                        className="h-12 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs btn-tactical flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Manual Entry
                    </button>

                    {/* Flip Camera */}
                    <button
                        type="button"
                        onClick={flipCamera}
                        className="w-12 h-12 rounded-full flex items-center justify-center btn-tactical border border-white/20 text-white"
                        style={{ background: "rgba(5,10,16,0.7)", backdropFilter: "blur(12px)" }}
                        title="Switch Camera"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Result Overlay */}
            {result && tone ? (
                <div
                    onClick={() => setResult(null)}
                    className={`fixed inset-0 z-50 flex flex-col justify-between p-6 cursor-pointer backdrop-blur-xl result-${tone === "success" ? "success" : "deny"} ${
                        tone === "success"
                            ? "bg-emerald-950/95 border-4 border-emerald-500"
                            : tone === "warn"
                            ? "bg-amber-950/95 border-4 border-amber-500"
                            : "bg-rose-950/95 border-4 border-rose-500"
                    }`}
                >
                    <div className="my-auto text-center max-w-sm mx-auto w-full">
                        {/* Big animated status icon */}
                        <div className={`w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl ${
                            tone === "success"
                                ? "bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                                : tone === "warn"
                                ? "bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                                : "bg-rose-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]"
                        }`}
                            style={{ animation: "scale-in 0.2s cubic-bezier(0.23,1,0.32,1)" }}
                        >
                            {tone === "success" ? (
                                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : tone === "warn" ? (
                                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        {/* Status label */}
                        <span className={`inline-block px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
                            tone === "success"
                                ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/40"
                                : tone === "warn"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-500/40"
                                : "bg-rose-400/20 text-rose-300 border border-rose-500/40"
                        }`}>
                            {tone === "success" && "ACCESS GRANTED"}
                            {tone === "warn" && "ALREADY CHECKED IN"}
                            {tone === "denied" && "ACCESS DENIED"}
                        </span>

                        {/* Attendee name */}
                        <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mt-3">
                            {attendeeDisplayName(result.attendee)}
                        </h2>

                        {/* Detail box */}
                        {tone === "success" ? (
                            <div className="mt-6 p-4 rounded-2xl glass-card text-left space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/60 font-medium">Ticket</span>
                                    <span className="font-bold text-white px-2.5 py-0.5 rounded bg-emerald-500/20 text-xs border border-emerald-500/30 uppercase font-mono">
                                        {result.attendee?.ticketType || "General"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/60 font-medium">Gate</span>
                                    <span className="font-semibold text-white">{result.accessEvent?.gate || session.gate}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/60 font-medium">Time</span>
                                    <span className="font-mono text-xs text-white">{formatTime(result.accessEvent?.occurredAt)}</span>
                                </div>
                            </div>
                        ) : tone === "warn" ? (
                            <div className="mt-6 p-4 rounded-2xl glass-card text-center space-y-2">
                                <p className="text-amber-200 text-sm font-semibold">{result.message || "QR code already used."}</p>
                                <p className="text-xs text-amber-300/60 font-mono">
                                    Previous: {formatTime(result.previousEntryAt || result.accessEvent?.occurredAt)}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 p-4 rounded-2xl glass-card text-center">
                                <p className="text-rose-200 text-sm font-semibold">{result.message || "Invalid credential."}</p>
                            </div>
                        )}
                    </div>

                    {/* Timer bar */}
                    <div className="w-full text-center">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-white/60" style={{ animation: "hud-scan 2.2s linear infinite" }} />
                        </div>
                        <p className="text-[11px] text-white/50 font-medium">Tap anywhere to continue</p>
                    </div>
                </div>
            ) : null}

            {/* Recent Scans Drawer */}
            <section className="border-t border-slate-800/60 p-4 max-h-52 overflow-y-auto no-scrollbar z-10"
                style={{ background: "rgba(5,10,16,0.95)" }}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
                        Activity Feed ({history.length})
                    </h3>
                    <span className="text-[10px] text-slate-600 font-mono">REAL-TIME</span>
                </div>

                {history.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-600 rounded-xl border border-slate-800/50" style={{ background: "rgba(13,21,32,0.5)" }}>
                        Waiting for first scan...
                    </div>
                ) : (
                    <ul className="space-y-1.5">
                        {history.map((h, idx) => (
                            <li
                                key={h.id}
                                className="p-2.5 rounded-xl flex items-center justify-between text-xs border border-slate-800/50"
                                style={{
                                    background: "rgba(13,21,32,0.6)",
                                    animation: idx === 0 ? "slide-in-up 0.2s ease" : "none",
                                }}
                            >
                                <div className="flex items-center gap-2.5 truncate">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${
                                            h.status === "SUCCESS"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : h.status === "ALREADY_ENTERED"
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        }`}
                                    >
                                        {shortStatus(h.status)}
                                    </span>
                                    <span className="font-semibold text-white truncate">{h.attendee}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                                    {formatTime(h.time)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Manual Token Modal */}
            {manualModalOpen ? (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ animation: "fade-in 0.15s ease" }}>
                    <div className="w-full max-w-xs rounded-2xl p-5 shadow-2xl" style={{ background: "rgba(13,21,32,0.95)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-white">Manual Token</h3>
                            <button
                                type="button"
                                onClick={() => setManualModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-800"
                                style={{ background: "rgba(10,16,24,0.8)" }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                                    16-char QR Token
                                </label>
                                <input
                                    type="text"
                                    value={manualTokenInput}
                                    onChange={(e) => setManualTokenInput(e.target.value)}
                                    placeholder="tk_abc123xyz..."
                                    autoFocus
                                    className="w-full rounded-xl px-3 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
                                    style={{
                                        background: "rgba(5,10,16,0.8)",
                                        border: "1px solid rgba(16,185,129,0.2)",
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
                                    onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.2)")}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setManualModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl text-slate-300 font-bold text-xs border border-slate-800"
                                    style={{ background: "rgba(13,21,32,0.8)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!manualTokenInput.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs btn-tactical"
                                >
                                    Validate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function formatTime(iso?: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return iso;
    }
}

function shortStatus(status: string) {
    if (status === "SUCCESS") return "OK";
    if (status === "ALREADY_ENTERED") return "DUP";
    return "DENIED";
}
