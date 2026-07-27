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
    }, []);

    useEffect(() => {
        if (!online || !session.token) return;
        const beat = () => {
            void apiPost(
                "scanner/heartbeat",
                { appVersion: APP_VERSION },
                { scannerToken: session.token }
            ).catch((e) => {
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
                    { facingMode: "environment" },
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
    }, [online, unpaired]);

    if (unpaired) {
        return (
            <div className="unpaired">
                <h1>This scanner is no longer paired.</h1>
                <p>
                    The event may have been archived or an organizer revoked
                    this device.
                </p>
                <button type="button" onClick={() => router.replace("/pair")}>
                    Pair again
                </button>
                <style jsx>{`
                    .unpaired {
                        min-height: 100dvh;
                        display: grid;
                        place-content: center;
                        padding: 1.5rem;
                        text-align: center;
                        gap: 0.75rem;
                    }
                    h1 {
                        margin: 0;
                        font-size: 1.35rem;
                    }
                    p {
                        margin: 0;
                        color: var(--muted);
                    }
                    button {
                        margin-top: 0.75rem;
                        border: 0;
                        border-radius: 0.65rem;
                        padding: 0.9rem 1.2rem;
                        background: #2563eb;
                        color: white;
                        font-weight: 650;
                    }
                `}</style>
            </div>
        );
    }

    const tone = result ? resultTone(result.result) : null;

    return (
        <div className="scan-root">
            <header className="bar">
                <div>
                    <p className="brand">Qrezo Scanner</p>
                    <p className="meta">
                        {session.eventName} · {session.gate}
                    </p>
                </div>
                <button
                    type="button"
                    className="link"
                    onClick={() => router.push("/settings")}
                >
                    Settings
                </button>
            </header>

            {!online ? (
                <div className="offline" role="alert">
                    You are offline. Scanning is paused until connection
                    returns.
                </div>
            ) : null}

            {cameraError ? (
                <div className="cam-err" role="alert">
                    {cameraError}
                </div>
            ) : null}

            <div className="viewport">
                <div id={containerId} className="reader" />
                {online && scanning && !result ? (
                    <p className="hint">Point at attendee QR</p>
                ) : null}
            </div>

            {result && tone ? (
                <div className={`overlay ${tone}`} role="status">
                    <div className="card">
                        <p className="status">
                            {tone === "success" && "SUCCESS"}
                            {tone === "warn" && "ALREADY ENTERED"}
                            {tone === "denied" && "DENIED"}
                        </p>
                        {tone === "success" ? (
                            <>
                                <h2>{attendeeDisplayName(result.attendee)}</h2>
                                <dl>
                                    <div>
                                        <dt>Ticket</dt>
                                        <dd>
                                            {result.attendee?.ticketType ||
                                                "General"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Event</dt>
                                        <dd>
                                            {result.event?.name ||
                                                session.eventName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Gate</dt>
                                        <dd>
                                            {result.accessEvent?.gate ||
                                                session.gate}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Time</dt>
                                        <dd>
                                            {formatTime(
                                                result.accessEvent?.occurredAt
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </>
                        ) : null}
                        {tone === "warn" ? (
                            <>
                                <h2>{attendeeDisplayName(result.attendee)}</h2>
                                <p className="msg">{result.message}</p>
                                <p className="prev">
                                    Previous entry:{" "}
                                    {formatTime(
                                        result.previousEntryAt ||
                                            result.accessEvent?.occurredAt
                                    )}
                                </p>
                            </>
                        ) : null}
                        {tone === "denied" ? (
                            <>
                                <h2>
                                    {result.attendee
                                        ? attendeeDisplayName(result.attendee)
                                        : "Access denied"}
                                </h2>
                                <p className="msg">{result.message}</p>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <section className="history">
                <h3>Recent scans</h3>
                {history.length === 0 ? (
                    <p className="empty">No scans yet</p>
                ) : (
                    <ul>
                        {history.map((h) => (
                            <li key={h.id}>
                                <span
                                    className={`pill ${resultTone(h.status)}`}
                                >
                                    {shortStatus(h.status)}
                                </span>
                                <span className="who">{h.attendee}</span>
                                <time>{formatTime(h.time)}</time>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <style jsx>{`
                .scan-root {
                    min-height: 100dvh;
                    max-width: 32rem;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg);
                }
                .bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 0.9rem 1rem;
                    gap: 0.75rem;
                }
                .brand {
                    margin: 0;
                    font-size: 0.7rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #93c5fd;
                    font-weight: 700;
                }
                .meta {
                    margin: 0.15rem 0 0;
                    font-size: 0.9rem;
                    color: var(--muted);
                }
                .link {
                    border: 0;
                    background: transparent;
                    color: #93c5fd;
                    font-size: 0.9rem;
                    padding: 0.25rem;
                }
                .offline {
                    margin: 0 1rem 0.75rem;
                    padding: 0.85rem 1rem;
                    border-radius: 0.65rem;
                    background: #7c2d12;
                    color: #ffedd5;
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                .cam-err {
                    margin: 0 1rem 0.75rem;
                    padding: 0.85rem 1rem;
                    border-radius: 0.65rem;
                    background: #7f1d1d;
                    color: #fecaca;
                }
                .viewport {
                    position: relative;
                    background: #000;
                    min-height: 18rem;
                }
                .reader {
                    width: 100%;
                }
                .reader :global(video) {
                    width: 100% !important;
                    object-fit: cover;
                }
                .hint {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0.75rem;
                    text-align: center;
                    margin: 0;
                    font-size: 0.85rem;
                    color: #e2e8f0;
                    text-shadow: 0 1px 4px #000;
                }
                .overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 40;
                    display: grid;
                    place-items: center;
                    padding: 1.25rem;
                }
                .overlay.success {
                    background: #059669f2;
                }
                .overlay.warn {
                    background: #d97706f2;
                }
                .overlay.denied {
                    background: #dc2626f2;
                }
                .card {
                    width: min(100%, 22rem);
                    color: white;
                    text-align: center;
                }
                .status {
                    margin: 0 0 0.5rem;
                    font-size: 0.8rem;
                    letter-spacing: 0.14em;
                    font-weight: 800;
                }
                h2 {
                    margin: 0 0 1rem;
                    font-size: 1.85rem;
                    line-height: 1.15;
                }
                dl {
                    margin: 0;
                    display: grid;
                    gap: 0.65rem;
                    text-align: left;
                }
                dl div {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.25);
                    padding-top: 0.55rem;
                }
                dt {
                    opacity: 0.85;
                    font-size: 0.85rem;
                }
                dd {
                    margin: 0;
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                .msg {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 600;
                }
                .prev {
                    margin: 1rem 0 0;
                    font-size: 1rem;
                    opacity: 0.95;
                }
                .history {
                    padding: 1rem 1rem 2rem;
                    flex: 1;
                }
                h3 {
                    margin: 0 0 0.65rem;
                    font-size: 0.85rem;
                    color: var(--muted);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .empty {
                    color: var(--muted);
                    margin: 0;
                    font-size: 0.9rem;
                }
                ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                }
                li {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    gap: 0.65rem;
                    align-items: center;
                    padding: 0.65rem 0.75rem;
                    border-radius: 0.55rem;
                    background: #0f172a;
                    border: 1px solid #1f2937;
                    font-size: 0.9rem;
                }
                .who {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                time {
                    color: var(--muted);
                    font-size: 0.78rem;
                }
                .pill {
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.3rem;
                }
                .pill.success {
                    background: #064e3b;
                    color: #6ee7b7;
                }
                .pill.warn {
                    background: #78350f;
                    color: #fcd34d;
                }
                .pill.denied {
                    background: #7f1d1d;
                    color: #fca5a5;
                }
            `}</style>
        </div>
    );
}

function formatTime(iso?: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

function shortStatus(status: string) {
    if (status === "SUCCESS") return "OK";
    if (status === "ALREADY_ENTERED") return "DUP";
    return "NO";
}
