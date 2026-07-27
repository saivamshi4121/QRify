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
        <main className="min-h-dvh bg-[#090d16] flex flex-col justify-between p-5 max-w-md mx-auto">
            {/* Header */}
            <header className="py-2 border-b border-zinc-900 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Staff Setup</span>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        {step === "workspace" && "1. Select Workspace"}
                        {step === "event" && "2. Select Active Event"}
                        {step === "gate" && "3. Select Gate Location"}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-xs text-zinc-500 hover:text-rose-400 font-medium px-2 py-1 transition-colors"
                >
                    Sign Out
                </button>
            </header>

            {/* Breadcrumb indicator */}
            {workspaceName ? (
                <div className="py-2 text-xs text-zinc-400 border-b border-zinc-900/60 flex items-center gap-1.5">
                    <span className="text-zinc-200 font-semibold">{workspaceName}</span>
                    {eventName ? (
                        <>
                            <span className="text-zinc-600">/</span>
                            <span className="text-blue-400 font-semibold">{eventName}</span>
                        </>
                    ) : null}
                </div>
            ) : null}

            {/* Content Body */}
            <div className="my-auto py-6">
                {error ? (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <span className="text-xs font-medium">Fetching options…</span>
                    </div>
                ) : null}

                {/* Step 1: Workspaces */}
                {step === "workspace" && !loading ? (
                    <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Available Workspaces</p>
                        {workspaces.map((ws) => (
                            <button
                                key={ws.workspaceId}
                                type="button"
                                onClick={() => selectWorkspace(ws)}
                                className="w-full p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left flex items-center justify-between group transition-all active:scale-[0.98]"
                            >
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{ws.name}</p>
                                    {ws.role ? <p className="text-xs text-zinc-500 capitalize">{ws.role.toLowerCase()}</p> : null}
                                </div>
                                <svg className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                ) : null}

                {/* Step 2: Events */}
                {step === "event" && !loading ? (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setStep("workspace")}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Change Workspace
                        </button>
                        <div className="space-y-2.5">
                            {events.map((ev) => (
                                <button
                                    key={String(ev._id)}
                                    type="button"
                                    onClick={() => selectEvent(ev)}
                                    className="w-full p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left flex items-center justify-between group transition-all active:scale-[0.98]"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{ev.name}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                                            {ev.status}
                                        </span>
                                    </div>
                                    <svg className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                            {events.length === 0 ? (
                                <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800">
                                    <p className="text-sm text-zinc-400">No published events found in this workspace.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {/* Step 3: Gate selection */}
                {step === "gate" ? (
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => setStep("event")}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Change Event
                        </button>

                        <div className="grid grid-cols-2 gap-2.5">
                            {DEFAULT_GATES.map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => finish(g)}
                                    className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left font-bold text-sm text-white transition-all active:scale-[0.98]"
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                                Custom Gate
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={customGate}
                                    onChange={(e) => setCustomGate(e.target.value)}
                                    placeholder="e.g. South VIP Entrance"
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    disabled={busy || !customGate.trim()}
                                    onClick={() => finish(customGate)}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-semibold text-xs transition-all shrink-0"
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Footer */}
            <footer className="py-2 text-center text-xs text-zinc-600">
                Authorized Staff Setup • Qrezo Scanner
            </footer>
        </main>
    );
}

