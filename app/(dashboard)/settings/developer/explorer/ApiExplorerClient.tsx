"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";

const ENDPOINTS = [
    {
        id: "list-events",
        method: "GET",
        path: "/api/v2/public/events",
        label: "List events",
        body: null as string | null,
    },
    {
        id: "create-attendee",
        method: "POST",
        path: "/api/v2/public/events/{eventId}/attendees",
        label: "Create attendee",
        body: JSON.stringify(
            {
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@example.com",
                ticketType: "General",
            },
            null,
            2
        ),
    },
    {
        id: "generate-credential",
        method: "POST",
        path: "/api/v2/public/events/{eventId}/attendees/{attendeeId}/credential",
        label: "Generate credential",
        body: JSON.stringify({ action: "generate" }, null, 2),
    },
    {
        id: "validate-access",
        method: "POST",
        path: "/api/v2/public/events/{eventId}/access/validate",
        label: "Validate access",
        body: JSON.stringify(
            { token: "PASTE_TOKEN", gate: "Main", type: "ENTRY" },
            null,
            2
        ),
    },
    {
        id: "analytics",
        method: "GET",
        path: "/api/v2/public/events/{eventId}/analytics?section=overview",
        label: "Analytics overview",
        body: null,
    },
] as const;

export default function ApiExplorerPage() {
    const [endpointId, setEndpointId] = useState<(typeof ENDPOINTS)[number]["id"]>(
        ENDPOINTS[0].id
    );
    const [apiKey, setApiKey] = useState("");
    const [eventId, setEventId] = useState("");
    const [attendeeId, setAttendeeId] = useState("");
    const [body, setBody] = useState(ENDPOINTS[0].body || "");
    const [response, setResponse] = useState("");
    const [busy, setBusy] = useState(false);

    const endpoint = ENDPOINTS.find((e) => e.id === endpointId)!;

    function resolvedPath() {
        return endpoint.path
            .replace("{eventId}", eventId || "{eventId}")
            .replace("{attendeeId}", attendeeId || "{attendeeId}");
    }

    async function run() {
        if (!apiKey.trim()) {
            toast.error("Paste an API key first");
            return;
        }
        setBusy(true);
        setResponse("");
        try {
            const path = resolvedPath();
            if (path.includes("{")) {
                throw new Error("Fill eventId / attendeeId placeholders");
            }
            const res = await fetch(path, {
                method: endpoint.method,
                headers: {
                    Authorization: `Bearer ${apiKey.trim()}`,
                    ...(endpoint.method !== "GET"
                        ? { "Content-Type": "application/json" }
                        : {}),
                },
                body:
                    endpoint.method === "GET"
                        ? undefined
                        : body || undefined,
            });
            const text = await res.text();
            try {
                setResponse(JSON.stringify(JSON.parse(text), null, 2));
            } catch {
                setResponse(text);
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Request failed");
        } finally {
            setBusy(false);
        }
    }

    const curl = `curl -X ${endpoint.method} '${typeof window !== "undefined" ? window.location.origin : ""}${resolvedPath()}' \\
  -H 'Authorization: Bearer ${apiKey || "qz_test_…"}'${
      endpoint.method !== "GET"
          ? ` \\
  -H 'Content-Type: application/json' \\
  -d '${(body || "{}").replace(/'/g, "'\\''")}'`
          : ""
  }`;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex items-start gap-3">
                <Link
                    href="/settings/developer"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        API Explorer
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Execute public API calls with your key. Keys never use
                        session cookies.
                    </p>
                </div>
            </div>

            <SectionCard title="Request">
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                        API key
                        <input
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="qz_test_…"
                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                        />
                    </label>
                    <label className="block text-sm font-medium text-slate-300">
                        Endpoint
                        <select
                            value={endpointId}
                            onChange={(e) => {
                                const next = ENDPOINTS.find(
                                    (x) => x.id === e.target.value
                                )!;
                                setEndpointId(next.id);
                                setBody(next.body || "");
                            }}
                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white focus:border-indigo-500/50 focus:outline-none"
                        >
                            {ENDPOINTS.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.method} — {e.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-300">
                            eventId
                            <input
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                            />
                        </label>
                        <label className="block text-sm font-medium text-slate-300">
                            attendeeId
                            <input
                                value={attendeeId}
                                onChange={(e) => setAttendeeId(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                            />
                        </label>
                    </div>
                    <p className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 font-mono text-xs text-slate-300">
                        {endpoint.method} {resolvedPath()}
                    </p>
                    {endpoint.method !== "GET" ? (
                        <label className="block text-sm font-medium text-slate-300">
                            Body
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={8}
                                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                            />
                        </label>
                    ) : null}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={run}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                        style={{
                            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                            border: "1px solid rgba(99,102,241,0.3)",
                        }}
                    >
                        {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Execute
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Response">
                <pre className="max-h-96 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs font-mono text-slate-200">
                    {response || "// Run a request to see the response"}
                </pre>
            </SectionCard>

            <SectionCard title="cURL">
                <pre className="overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs font-mono text-slate-300">
                    {curl}
                </pre>
                <button
                    type="button"
                    className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => {
                        void navigator.clipboard.writeText(curl);
                        toast.success("Copied cURL");
                    }}
                >
                    Copy
                </button>
            </SectionCard>
        </div>
    );
}
