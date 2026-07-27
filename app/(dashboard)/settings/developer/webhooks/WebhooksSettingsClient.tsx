"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Copy,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Trash2,
    Webhook,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { WEBHOOK_EVENT_TYPE_VALUES } from "@/modules/webhooks/constants";

type Endpoint = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    url: string;
    enabled: boolean;
    eventTypes: string[];
    secretPrefix: string;
    timeoutMs: number;
    createdAt: string;
};

type Delivery = {
    id: string;
    publicId: string;
    webhookId: string;
    webhookName: string;
    eventType: string;
    status: string;
    attempt: number;
    responseCode: number | null;
    durationMs: number | null;
    errorMessage: string | null;
    createdAt: string;
    payload: Record<string, unknown>;
};

type CreatedEndpoint = Endpoint & { secret: string };

type Integration = {
    id: string;
    name: string;
    description: string;
};

export default function WebhooksSettingsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [freshSecret, setFreshSecret] = useState<CreatedEndpoint | null>(
        null
    );
    const [selectedPayload, setSelectedPayload] = useState<Delivery | null>(
        null
    );

    const [name, setName] = useState("My webhook");
    const [url, setUrl] = useState("");
    const [eventTypes, setEventTypes] = useState<string[]>([
        "attendee.created",
        "access.granted",
    ]);
    const [filterEvent, setFilterEvent] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ deliveries: "1", limit: "40" });
            if (filterEvent) qs.set("eventType", filterEvent);
            if (filterStatus) qs.set("status", filterStatus);
            if (search.trim()) qs.set("q", search.trim());

            const [e, d, m] = await Promise.all([
                fetch("/api/v2/developer/webhooks").then((r) => r.json()),
                fetch(`/api/v2/developer/webhooks?${qs}`).then((r) => r.json()),
                fetch("/api/v2/developer/webhooks?meta=1").then((r) => r.json()),
            ]);
            if (!e.success) throw new Error(e.message || "Failed to load");
            setEndpoints(e.data || []);
            setDeliveries(d.success ? d.data?.items || [] : []);
            setIntegrations(m.success ? m.data?.integrations || [] : []);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [filterEvent, filterStatus, search]);

    useEffect(() => {
        if (status === "authenticated") void load();
    }, [status, load]);

    function toggleEvent(type: string) {
        setEventTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    }

    async function createEndpoint() {
        if (!url.trim() || eventTypes.length === 0) {
            toast.error("URL and at least one event are required");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch("/api/v2/developer/webhooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, url: url.trim(), eventTypes }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Create failed");
            setFreshSecret(json.data);
            setUrl("");
            toast.success("Webhook created — copy the secret now");
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Create failed");
        } finally {
            setCreating(false);
        }
    }

    async function setEnabled(ep: Endpoint, enabled: boolean) {
        const res = await fetch(`/api/v2/developer/webhooks/${ep.publicId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled }),
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Update failed");
            return;
        }
        toast.success(enabled ? "Enabled" : "Disabled");
        await load();
    }

    async function rotateSecret(ep: Endpoint) {
        if (!confirm(`Rotate secret for "${ep.name}"?`)) return;
        const res = await fetch(
            `/api/v2/developer/webhooks/${ep.publicId}/rotate`,
            { method: "POST" }
        );
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Rotate failed");
            return;
        }
        setFreshSecret(json.data);
        toast.success("Secret rotated — copy it now");
        await load();
    }

    async function removeEndpoint(ep: Endpoint) {
        if (!confirm(`Delete webhook "${ep.name}"?`)) return;
        const res = await fetch(`/api/v2/developer/webhooks/${ep.publicId}`, {
            method: "DELETE",
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Delete failed");
            return;
        }
        toast.success("Deleted");
        await load();
    }

    async function replay(delivery: Delivery) {
        const res = await fetch(
            `/api/v2/developer/webhooks/deliveries/${delivery.publicId}`,
            { method: "POST" }
        );
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Replay failed");
            return;
        }
        toast.success("Replay queued");
        await load();
    }

    function applyTemplate(integration: Integration) {
        setName(`${integration.name} webhook`);
        if (integration.id === "n8n") {
            setEventTypes([
                "attendee.created",
                "access.granted",
                "credential.generated",
            ]);
        } else if (integration.id === "zapier") {
            setEventTypes([
                "attendee.created",
                "attendee.updated",
                "access.granted",
            ]);
        } else if (integration.id === "make") {
            setEventTypes([
                "attendee.created",
                "credential.generated",
                "access.granted",
            ]);
        } else {
            setEventTypes([...WEBHOOK_EVENT_TYPE_VALUES]);
        }
        toast.message(`Template applied: ${integration.name}`);
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex items-start gap-3">
                <Link
                    href="/settings/developer"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Webhooks
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Subscribe external systems to Qrezo domain events with
                        signed HTTPS deliveries.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/docs/developer/webhooks"
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Documentation
                </Link>
                <button
                    type="button"
                    onClick={() => load()}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {freshSecret ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                        Copy your webhook secret now — it won&apos;t be shown
                        again.
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="flex-1 break-all rounded-md bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-amber-200">
                            {freshSecret.secret}
                        </code>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md bg-amber-700 px-3 py-2 text-sm text-white"
                            onClick={() => {
                                void navigator.clipboard.writeText(
                                    freshSecret.secret
                                );
                                toast.success("Copied");
                            }}
                        >
                            <Copy className="h-4 w-4" />
                            Copy
                        </button>
                    </div>
                    <button
                        type="button"
                        className="mt-3 text-sm text-amber-800 underline"
                        onClick={() => setFreshSecret(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {integrations.length > 0 ? (
                <SectionCard title="Integration templates">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {integrations.map((i) => (
                            <button
                                key={i.id}
                                type="button"
                                onClick={() => applyTemplate(i)}
                                className="rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                            >
                                <p className="font-medium text-slate-900">
                                    {i.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {i.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </SectionCard>
            ) : null}

            <SectionCard
                title="Create endpoint"
                icon={<Plus className="h-5 w-5" />}
            >
                <div className="space-y-3">
                    <label className="block text-sm text-slate-600">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                        />
                    </label>
                    <label className="block text-sm text-slate-600">
                        URL
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/hooks/qrezo"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
                        />
                    </label>
                    <div>
                        <p className="text-sm text-slate-600">Events</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {WEBHOOK_EVENT_TYPE_VALUES.map((type) => (
                                <label
                                    key={type}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs"
                                >
                                    <input
                                        type="checkbox"
                                        checked={eventTypes.includes(type)}
                                        onChange={() => toggleEvent(type)}
                                    />
                                    {type}
                                </label>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={creating}
                        onClick={createEndpoint}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                        {creating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Webhook className="h-4 w-4" />
                        )}
                        Create webhook
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Endpoints">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                ) : endpoints.length === 0 ? (
                    <p className="text-sm text-slate-500">No webhooks yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {endpoints.map((ep) => (
                            <li
                                key={ep.publicId}
                                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                        {ep.name}{" "}
                                        <span className="text-xs font-normal text-slate-400">
                                            {ep.enabled ? "ON" : "OFF"} ·{" "}
                                            {ep.secretPrefix}…
                                        </span>
                                    </p>
                                    <p className="truncate font-mono text-xs text-slate-500">
                                        {ep.url}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {ep.eventTypes.join(", ")}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEnabled(ep, !ep.enabled)
                                        }
                                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs"
                                    >
                                        {ep.enabled ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => rotateSecret(ep)}
                                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs"
                                    >
                                        Rotate secret
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeEndpoint(ep)}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard title="Delivery history">
                <div className="mb-3 flex flex-wrap gap-2">
                    <select
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                        <option value="">All events</option>
                        {WEBHOOK_EVENT_TYPE_VALUES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                        <option value="">All statuses</option>
                        {[
                            "PENDING",
                            "PROCESSING",
                            "DELIVERED",
                            "FAILED",
                            "RETRYING",
                            "CANCELLED",
                        ].map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    />
                </div>

                {deliveries.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No deliveries logged yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2 pr-3">Time</th>
                                    <th className="py-2 pr-3">Endpoint</th>
                                    <th className="py-2 pr-3">Event</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3">Attempt</th>
                                    <th className="py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {deliveries.map((d) => (
                                    <tr key={d.publicId}>
                                        <td className="py-2 pr-3 text-xs text-slate-500">
                                            {new Date(
                                                d.createdAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {d.webhookName}
                                        </td>
                                        <td className="py-2 pr-3 font-mono text-xs">
                                            {d.eventType}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {d.status}
                                            {d.responseCode
                                                ? ` (${d.responseCode})`
                                                : ""}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {d.attempt}
                                            {d.durationMs != null
                                                ? ` · ${d.durationMs}ms`
                                                : ""}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="text-xs text-indigo-600 hover:underline"
                                                    onClick={() =>
                                                        setSelectedPayload(d)
                                                    }
                                                >
                                                    Payload
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-0.5 text-xs text-slate-600 hover:underline"
                                                    onClick={() => replay(d)}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    Replay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {selectedPayload ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                Delivery {selectedPayload.publicId}
                            </h2>
                            <button
                                type="button"
                                className="text-sm text-slate-500"
                                onClick={() => setSelectedPayload(null)}
                            >
                                Close
                            </button>
                        </div>
                        {selectedPayload.errorMessage ? (
                            <p className="mb-2 text-sm text-red-600">
                                {selectedPayload.errorMessage}
                            </p>
                        ) : null}
                        <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                            {JSON.stringify(selectedPayload.payload, null, 2)}
                        </pre>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
