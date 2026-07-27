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
        setHistory((prev) => [item, ...prev].slice(0, 20));
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

    // Flashlight toggle handler
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
            // Flashlight hardware unsupported on browser/device
        }
    };

    // Camera Flip toggle handler
    const flipCamera = () => {
        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    };

    // Manual code submit handler
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTokenInput.trim()) return;
        setManualModalOpen(false);
        void handleDecode(manualTokenInput.trim());
        setManualTokenInput("");
    };

    if (unpaired) {
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
                        Pair Scanner Again
                    </button>
                </div>
            </main>
        );
    }

    const tone = result ? resultTone(result.result) : null;

    return (
        <div className="min-h-dvh bg-[#090d16] max-w-md mx-auto flex flex-col justify-between relative overflow-hidden select-none">
            {/* Top Status Header */}
            <header className="px-4 py-3 bg-zinc-950/90 border-b border-zinc-900 backdrop-blur-md flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    {/* Live pulse dot */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            {online ? "LIVE" : "OFFLINE"}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-zinc-800" />

                    <div>
                        <p className="text-xs font-bold text-white leading-tight truncate max-w-[150px]">
                            {session.gate || "Gate"} • {session.eventName}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                            {session.deviceName} • Sync: {lastSyncTime}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Battery status placeholder */}
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-emerald-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        98%
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/settings")}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Offline Alert Bar */}
            {!online ? (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2 z-20">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m1.414 1.414a7 7 0 000 9.9m9.9 0a7 7 0 000-9.9M9.879 9.879a3 3 0 014.242 0M9.88 9.88l4.24 4.24" />
                    </svg>
                    Device Offline. Scanning paused until connection returns.
                </div>
            ) : null}

            {/* Camera Viewfinder Area */}
            <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
                <div id={containerId} className="w-full h-full object-cover" />

                {/* Viewfinder Target Framing Overlay */}
                {online && scanning && !result ? (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                        <div className="w-64 h-64 border-2 border-emerald-500/80 rounded-3xl relative shadow-[0_0_50px_rgba(16,185,129,0.25)] flex items-center justify-center">
                            {/* Reticle Corner Brackets */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                            {/* Laser Line */}
                            <div className="w-[90%] h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-laser absolute" />
                        </div>
                        <p className="mt-4 text-xs font-semibold text-white/90 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 tracking-wide shadow-lg">
                            Align QR code inside reticle frame
                        </p>
                    </div>
                ) : null}

                {/* Camera Control Toolbar (Torch, Flip Camera, Manual Entry) */}
                <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-center gap-4 z-20">
                    <button
                        type="button"
                        onClick={toggleTorch}
                        className={`p-3.5 rounded-full border backdrop-blur-md shadow-xl transition-all active:scale-95 ${
                            torchOn
                                ? "bg-amber-500 border-amber-400 text-black shadow-amber-500/30"
                                : "bg-black/60 border-white/20 text-white hover:bg-black/80"
                        }`}
                        title="Toggle Flashlight"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => setManualModalOpen(true)}
                        className="px-5 py-3 rounded-full bg-blue-600/90 hover:bg-blue-600 border border-blue-400/30 text-white font-semibold text-xs backdrop-blur-md shadow-xl flex items-center gap-2 transition-all active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Manual Token Entry
                    </button>

                    <button
                        type="button"
                        onClick={flipCamera}
                        className="p-3.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 backdrop-blur-md shadow-xl transition-all active:scale-95"
                        title="Switch Camera"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* FULL SCREEN RESULT OVERLAY */}
            {result && tone ? (
                <div
                    onClick={() => setResult(null)}
                    className={`fixed inset-0 z-50 flex flex-col justify-between p-6 cursor-pointer backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                        tone === "success"
                            ? "bg-emerald-950/95 border-4 border-emerald-500"
                            : tone === "warn"
                            ? "bg-amber-950/95 border-4 border-amber-500"
                            : "bg-rose-950/95 border-4 border-rose-500"
                    }`}
                >
                    <div className="my-auto text-center max-w-sm mx-auto w-full">
                        {/* Big Animated Status Icon */}
                        <div
                            className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl ${
                                tone === "success"
                                    ? "bg-emerald-500 text-black shadow-emerald-500/50"
                                    : tone === "warn"
                                    ? "bg-amber-500 text-black shadow-amber-500/50"
                                    : "bg-rose-500 text-white shadow-rose-500/50"
                            }`}
                        >
                            {tone === "success" ? (
                                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : tone === "warn" ? (
                                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        {/* Status Label */}
                        <span
                            className={`inline-block px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-2 ${
                                tone === "success"
                                    ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/40"
                                    : tone === "warn"
                                    ? "bg-amber-400/20 text-amber-300 border border-amber-500/40"
                                    : "bg-rose-400/20 text-rose-300 border border-rose-500/40"
                            }`}
                        >
                            {tone === "success" && "ACCESS GRANTED"}
                            {tone === "warn" && "ALREADY CHECKED IN"}
                            {tone === "denied" && "ACCESS DENIED"}
                        </span>

                        {/* Attendee Name */}
                        <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mt-2">
                            {attendeeDisplayName(result.attendee)}
                        </h2>

                        {/* Detail Box */}
                        {tone === "success" ? (
                            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/70 font-medium">Ticket Type</span>
                                    <span className="font-bold text-white px-2.5 py-0.5 rounded bg-emerald-500/20 text-xs border border-emerald-500/30 uppercase">
                                        {result.attendee?.ticketType || "General Admission"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/70 font-medium">Access Gate</span>
                                    <span className="font-semibold text-white">{result.accessEvent?.gate || session.gate}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-200/70 font-medium">Scan Time</span>
                                    <span className="font-mono text-xs text-white">{formatTime(result.accessEvent?.occurredAt)}</span>
                                </div>
                            </div>
                        ) : tone === "warn" ? (
                            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-amber-500/30 text-center space-y-2">
                                <p className="text-amber-200 text-sm font-semibold">{result.message || "This QR code has already been used."}</p>
                                <p className="text-xs text-amber-300/80 font-mono">
                                    Previous Scan: {formatTime(result.previousEntryAt || result.accessEvent?.occurredAt)}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-rose-500/30 text-center space-y-2">
                                <p className="text-rose-200 text-sm font-semibold">{result.message || "Invalid ticket credential or unauthorized event."}</p>
                            </div>
                        )}
                    </div>

                    {/* Auto-Dismiss Timer Bar Footer */}
                    <div className="w-full text-center">
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-white animate-[laser-scan_2.2s_linear_infinite]" />
                        </div>
                        <p className="text-[11px] text-white/70 font-medium">Tap anywhere to scan next attendee</p>
                    </div>
                </div>
            ) : null}

            {/* Recent Scans Drawer Section */}
            <section className="bg-zinc-950 border-t border-zinc-900 p-4 max-h-48 overflow-y-auto no-scrollbar z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent Activity ({history.length})
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-mono">Real-time Feed</span>
                </div>

                {history.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-600 rounded-xl bg-zinc-900/40 border border-zinc-900">
                        No attendees scanned yet on this device.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {history.map((h) => (
                            <li
                                key={h.id}
                                className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-2.5 truncate">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                                            h.status === "SUCCESS"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : h.status === "ALREADY_ENTERED"
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        }`}
                                    >
                                        {shortStatus(h.status)}
                                    </span>
                                    <span className="font-semibold text-white truncate">{h.attendee}</span>
                                </div>
                                <span className="font-mono text-[11px] text-zinc-500 shrink-0 ml-2">
                                    {formatTime(h.time)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Manual Token Input Modal */}
            {manualModalOpen ? (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-white">Manual Token Entry</h3>
                            <button
                                type="button"
                                onClick={() => setManualModalOpen(false)}
                                className="text-zinc-400 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                                    Enter 16-character QR token code
                                </label>
                                <input
                                    type="text"
                                    value={manualTokenInput}
                                    onChange={(e) => setManualTokenInput(e.target.value)}
                                    placeholder="e.g. tk_abc123xyz"
                                    autoFocus
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setManualModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!manualTokenInput.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-semibold text-xs"
                                >
                                    Validate Token
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

