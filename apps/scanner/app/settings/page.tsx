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
        if (!confirm("Unpair this device? You will need a new pairing code.")) {
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
            <main style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                Loading…
            </main>
        );
    }

    if (error === "This scanner is no longer paired.") {
        return (
            <main className="settings">
                <h1>This scanner is no longer paired.</h1>
                <p className="sub">
                    The event may have been archived or this device was revoked.
                </p>
                <button type="button" className="primary" onClick={() => router.replace("/pair")}>
                    Pair again
                </button>
                <style jsx>{`
                    .settings {
                        min-height: 100dvh;
                        max-width: 24rem;
                        margin: 0 auto;
                        padding: 2rem 1.25rem;
                    }
                    h1 {
                        font-size: 1.35rem;
                    }
                    .sub {
                        color: var(--muted);
                        margin: 0.5rem 0 1.5rem;
                    }
                    .primary {
                        border: 0;
                        border-radius: 0.65rem;
                        padding: 0.95rem 1.2rem;
                        background: #2563eb;
                        color: white;
                        font-weight: 650;
                    }
                `}</style>
            </main>
        );
    }

    return (
        <main className="settings">
            <header>
                <button type="button" className="back" onClick={() => router.push("/scan")}>
                    ← Scanner
                </button>
                <p className="brand">Settings</p>
            </header>

            <dl>
                <div>
                    <dt>Device</dt>
                    <dd>{session.deviceName}</dd>
                </div>
                <div>
                    <dt>Workspace</dt>
                    <dd>{session.workspaceName}</dd>
                </div>
                <div>
                    <dt>Event</dt>
                    <dd>{session.eventName}</dd>
                </div>
                <div>
                    <dt>Gate</dt>
                    <dd>{session.gate || "Not set"}</dd>
                </div>
                <div>
                    <dt>App version</dt>
                    <dd>{APP_VERSION}</dd>
                </div>
                <div>
                    <dt>Connection</dt>
                    <dd>
                        {!online ? "Offline" : connection}
                    </dd>
                </div>
            </dl>

            {error ? <p className="err">{error}</p> : null}

            <div className="actions">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => router.push("/gate")}
                >
                    Change Gate
                </button>
                <button type="button" disabled={busy || !online} onClick={reconnect}>
                    Reconnect
                </button>
                <button type="button" className="danger" disabled={busy} onClick={unpair}>
                    Unpair Device
                </button>
            </div>

            <style jsx>{`
                .settings {
                    min-height: 100dvh;
                    max-width: 24rem;
                    margin: 0 auto;
                    padding: 1.25rem 1.25rem 2.5rem;
                }
                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                }
                .back {
                    border: 0;
                    background: transparent;
                    color: #93c5fd;
                    padding: 0;
                    font-size: 0.9rem;
                }
                .brand {
                    margin: 0;
                    font-size: 0.75rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--muted);
                    font-weight: 700;
                }
                dl {
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                dl div {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #1f2937;
                }
                dt {
                    color: var(--muted);
                    font-size: 0.85rem;
                }
                dd {
                    margin: 0;
                    font-weight: 600;
                    text-align: right;
                }
                .actions {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.55rem;
                }
                .actions button {
                    border: 1px solid #334155;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.65rem;
                    padding: 0.9rem;
                    font-size: 1rem;
                }
                .danger {
                    border-color: #7f1d1d !important;
                    color: #fca5a5 !important;
                }
                button:disabled {
                    opacity: 0.55;
                }
                .err {
                    color: #fca5a5;
                    margin: 1rem 0 0;
                }
            `}</style>
        </main>
    );
}
