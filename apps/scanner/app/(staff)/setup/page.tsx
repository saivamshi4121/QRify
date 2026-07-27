"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    apiGet,
    createStaffScannerSession,
    toLocalSession,
} from "@/lib/api";
import { DEFAULT_GATES, saveSession } from "@/lib/session";

type Workspace = {
    workspaceId: string;
    name: string;
    role?: string;
};
type EventItem = {
    _id: string;
    name: string;
    status: string;
};

type Step = "workspace" | "event" | "gate";

export default function SetupPage() {
    const router = useRouter();
    const { status } = useSession();
    const [step, setStep] = useState<Step>("workspace");
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [workspaceId, setWorkspaceId] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [eventId, setEventId] = useState("");
    const [eventName, setEventName] = useState("");
    const [customGate, setCustomGate] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await apiGet<{
                    workspaces: Workspace[];
                    defaultWorkspaceId?: string;
                }>("workspaces");
                if (cancelled) return;
                setWorkspaces(data.workspaces || []);
                if (data.defaultWorkspaceId) {
                    const ws = data.workspaces.find(
                        (w) => w.workspaceId === data.defaultWorkspaceId
                    );
                    if (ws) {
                        setWorkspaceId(ws.workspaceId);
                        setWorkspaceName(ws.name);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Failed to load workspaces"
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function selectWorkspace(ws: Workspace) {
        setError("");
        setWorkspaceId(ws.workspaceId);
        setWorkspaceName(ws.name);
        setLoading(true);
        try {
            const list = await apiGet<EventItem[]>(
                "events?status=PUBLISHED&sort=startDate_asc",
                { workspaceId: ws.workspaceId }
            );
            setEvents(Array.isArray(list) ? list : []);
            setStep("event");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load events");
        } finally {
            setLoading(false);
        }
    }

    function selectEvent(ev: EventItem) {
        setEventId(String(ev._id));
        setEventName(ev.name);
        setStep("gate");
    }

    async function finish(gate: string) {
        const g = gate.trim();
        if (!g || !workspaceId || !eventId) return;
        setBusy(true);
        setError("");
        try {
            const data = await createStaffScannerSession({
                eventId,
                gate: g,
                workspaceId,
                deviceName: `Staff — ${workspaceName}`,
            });
            saveSession(toLocalSession(data));
            router.replace("/scan");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to start session");
            setBusy(false);
        }
    }

    return (
        <main className="setup">
            <header>
                <div>
                    <p className="brand">Staff setup</p>
                    <h1>
                        {step === "workspace" && "Select workspace"}
                        {step === "event" && "Select event"}
                        {step === "gate" && "Select gate"}
                    </h1>
                </div>
                <button
                    type="button"
                    className="ghost"
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    Sign out
                </button>
            </header>

            {workspaceName ? (
                <p className="crumb">
                    {workspaceName}
                    {eventName ? ` · ${eventName}` : ""}
                </p>
            ) : null}

            {error ? <p className="err">{error}</p> : null}
            {loading ? <p className="muted">Loading…</p> : null}

            {step === "workspace" && !loading ? (
                <ul className="list">
                    {workspaces.map((ws) => (
                        <li key={ws.workspaceId}>
                            <button
                                type="button"
                                onClick={() => selectWorkspace(ws)}
                            >
                                <span>{ws.name}</span>
                                {ws.role ? (
                                    <em>{ws.role.toLowerCase()}</em>
                                ) : null}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            {step === "event" && !loading ? (
                <>
                    <button
                        type="button"
                        className="back"
                        onClick={() => setStep("workspace")}
                    >
                        ← Workspaces
                    </button>
                    <ul className="list">
                        {events.map((ev) => (
                            <li key={String(ev._id)}>
                                <button
                                    type="button"
                                    onClick={() => selectEvent(ev)}
                                >
                                    <span>{ev.name}</span>
                                    <em>{ev.status}</em>
                                </button>
                            </li>
                        ))}
                        {events.length === 0 ? (
                            <li className="empty">No published events</li>
                        ) : null}
                    </ul>
                </>
            ) : null}

            {step === "gate" ? (
                <>
                    <button
                        type="button"
                        className="back"
                        onClick={() => setStep("event")}
                    >
                        ← Events
                    </button>
                    <ul className="list">
                        {DEFAULT_GATES.map((g) => (
                            <li key={g}>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => finish(g)}
                                >
                                    <span>{g}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="custom">
                        <label>
                            Custom gate
                            <input
                                value={customGate}
                                onChange={(e) => setCustomGate(e.target.value)}
                                placeholder="e.g. North Entrance"
                            />
                        </label>
                        <button
                            type="button"
                            className="primary"
                            disabled={busy || !customGate.trim()}
                            onClick={() => finish(customGate)}
                        >
                            Start scanning
                        </button>
                    </div>
                </>
            ) : null}

            <style jsx>{`
                .setup {
                    min-height: 100dvh;
                    padding: 1.25rem 1.25rem 2.5rem;
                    max-width: 28rem;
                    margin: 0 auto;
                }
                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 0.75rem;
                }
                .brand {
                    margin: 0;
                    font-size: 0.75rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #93c5fd;
                    font-weight: 700;
                }
                h1 {
                    margin: 0.2rem 0 0;
                    font-size: 1.45rem;
                }
                .ghost {
                    border: 0;
                    background: transparent;
                    color: var(--muted);
                    font-size: 0.85rem;
                    padding: 0.35rem;
                }
                .crumb {
                    color: var(--muted);
                    font-size: 0.85rem;
                    margin: 0 0 1rem;
                }
                .list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.55rem;
                }
                .list button {
                    width: 100%;
                    text-align: left;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.75rem;
                    border: 1px solid #1f2937;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.75rem;
                    padding: 1rem 1.05rem;
                    font-size: 1rem;
                }
                .list em {
                    font-style: normal;
                    color: var(--muted);
                    font-size: 0.8rem;
                    text-transform: capitalize;
                }
                .empty {
                    color: var(--muted);
                    padding: 1rem 0;
                }
                .back {
                    border: 0;
                    background: transparent;
                    color: #93c5fd;
                    padding: 0 0 0.85rem;
                    font-size: 0.9rem;
                }
                .custom {
                    margin-top: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                label {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    font-size: 0.85rem;
                    color: var(--muted);
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
                    font-size: 1rem;
                    font-weight: 600;
                    background: #2563eb;
                    color: white;
                }
                button:disabled {
                    opacity: 0.5;
                }
                .err {
                    color: #fca5a5;
                    margin: 0 0 0.75rem;
                }
                .muted {
                    color: var(--muted);
                }
            `}</style>
        </main>
    );
}
