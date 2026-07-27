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
            <main
                style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                }}
            >
                Loading…
            </main>
        );
    }

    return (
        <main className="gate">
            <p className="brand">Qrezo Scanner</p>
            <h1>Choose gate</h1>
            <p className="sub">
                {session.eventName} · {session.workspaceName}
            </p>
            {error ? <p className="err">{error}</p> : null}
            <ul>
                {DEFAULT_GATES.map((g) => (
                    <li key={g}>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => choose(g)}
                        >
                            {g}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="custom">
                <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Custom gate name"
                    disabled={busy}
                />
                <button
                    type="button"
                    className="primary"
                    disabled={busy || !custom.trim()}
                    onClick={() => choose(custom)}
                >
                    Continue
                </button>
            </div>
            <style jsx>{`
                .gate {
                    min-height: 100dvh;
                    max-width: 24rem;
                    margin: 0 auto;
                    padding: 1.5rem 1.25rem 2.5rem;
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
                    margin: 0.35rem 0 0;
                    font-size: 1.55rem;
                }
                .sub {
                    color: var(--muted);
                    margin: 0.35rem 0 1.25rem;
                    font-size: 0.9rem;
                }
                ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                ul button {
                    width: 100%;
                    text-align: left;
                    border: 1px solid #1f2937;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.7rem;
                    padding: 0.95rem 1rem;
                    font-size: 1rem;
                }
                .custom {
                    margin-top: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.65rem;
                }
                input {
                    border: 1px solid #1f2937;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.65rem;
                    padding: 0.85rem 0.9rem;
                    font-size: 1rem;
                }
                .primary {
                    border: 0;
                    border-radius: 0.65rem;
                    padding: 0.95rem;
                    font-weight: 650;
                    background: #2563eb;
                    color: white;
                }
                button:disabled {
                    opacity: 0.55;
                }
                .err {
                    color: #fca5a5;
                    margin: 0 0 0.75rem;
                }
            `}</style>
        </main>
    );
}
