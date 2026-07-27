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
            setError(e instanceof Error ? e.message : "Pairing failed");
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
                            : "Unable to open camera"
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

    return (
        <main className="pair">
            <header>
                <Link href="/">← Back</Link>
                <p className="brand">Qrezo Scanner</p>
            </header>
            <h1>Enter pairing code</h1>
            <p className="sub">
                Ask an organizer for the 6-digit code from Scanner Devices, or
                scan the pairing QR.
            </p>

            <form onSubmit={onSubmit}>
                <input
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    autoFocus
                    disabled={loading}
                />
                <button type="submit" disabled={loading || code.length !== 6}>
                    {loading ? "Pairing…" : "Pair device"}
                </button>
            </form>

            {error ? <p className="err">{error}</p> : null}

            <div className="or">or</div>

            {!scanningQr ? (
                <button
                    type="button"
                    className="scan-btn"
                    onClick={() => {
                        setCameraError("");
                        setScanningQr(true);
                    }}
                    disabled={loading}
                >
                    Scan pairing QR
                </button>
            ) : (
                <div className="cam">
                    <div id={readerId} />
                    <button
                        type="button"
                        className="scan-btn"
                        onClick={() => setScanningQr(false)}
                    >
                        Cancel camera
                    </button>
                </div>
            )}
            {cameraError ? <p className="err">{cameraError}</p> : null}

            <style jsx>{`
                .pair {
                    min-height: 100dvh;
                    max-width: 24rem;
                    margin: 0 auto;
                    padding: 1.25rem 1.25rem 2.5rem;
                }
                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                header a {
                    color: #93c5fd;
                    text-decoration: none;
                    font-size: 0.9rem;
                }
                .brand {
                    margin: 0;
                    font-size: 0.7rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #93c5fd;
                    font-weight: 700;
                }
                h1 {
                    margin: 0;
                    font-size: 1.55rem;
                }
                .sub {
                    margin: 0.45rem 0 1.4rem;
                    color: var(--muted);
                    font-size: 0.95rem;
                    line-height: 1.4;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                input {
                    text-align: center;
                    font-size: 2rem;
                    letter-spacing: 0.35em;
                    font-family: ui-monospace, monospace;
                    border: 1px solid #1f2937;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.75rem;
                    padding: 0.9rem;
                }
                button[type="submit"] {
                    border: 0;
                    border-radius: 0.75rem;
                    padding: 0.95rem;
                    font-size: 1rem;
                    font-weight: 650;
                    background: #2563eb;
                    color: white;
                }
                button:disabled {
                    opacity: 0.55;
                }
                .or {
                    text-align: center;
                    color: var(--muted);
                    margin: 1.4rem 0;
                    font-size: 0.85rem;
                }
                .scan-btn {
                    width: 100%;
                    border: 1px solid #334155;
                    background: transparent;
                    color: #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 0.9rem;
                    font-size: 1rem;
                }
                .cam {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .err {
                    color: #fca5a5;
                    margin: 0.75rem 0 0;
                    font-size: 0.9rem;
                }
            `}</style>
        </main>
    );
}
