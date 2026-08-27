"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Copy,
    KeyRound,
    Loader2,
    Plus,
    RefreshCw,
    ShieldOff,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import {
    API_KEY_SCOPE_VALUES,
    DEFAULT_API_KEY_SCOPES,
} from "@/modules/api-key/constants";

type ApiKeyRow = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    keyPrefix: string;
    permissions: string[];
    environment: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

type LogRow = {
    id: string;
    apiKeyPublicId: string;
    apiKeyName: string;
    method: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    createdAt: string;
};

type CreatedKey = ApiKeyRow & { apiKey: string };

export default function DeveloperSettingsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKeyRow[]>([]);
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("My App Key");
    const [environment, setEnvironment] = useState<"TEST" | "LIVE">("TEST");
    const [permissions, setPermissions] = useState<string[]>([
        ...DEFAULT_API_KEY_SCOPES,
    ]);
    const [freshKey, setFreshKey] = useState<CreatedKey | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [k, l] = await Promise.all([
                fetch("/api/v2/developer/api-keys").then((r) => r.json()),
                fetch("/api/v2/developer/api-keys?logs=1&limit=40").then((r) =>
                    r.json()
                ),
            ]);
            if (!k.success) throw new Error(k.message || "Failed to load keys");
            setKeys(k.data || []);
            setLogs(l.success ? l.data || [] : []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") void load();
    }, [status, load]);

    async function createKey() {
        setCreating(true);
        try {
            const res = await fetch("/api/v2/developer/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, environment, permissions }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Create failed");
            setFreshKey(json.data);
            toast.success("API key created — copy it now");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Create failed");
        } finally {
            setCreating(false);
        }
    }

    async function revoke(key: ApiKeyRow) {
        if (!confirm(`Revoke "${key.name}"? This cannot be undone.`)) return;
        const res = await fetch(`/api/v2/developer/api-keys/${key.publicId}`, {
            method: "DELETE",
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Revoke failed");
            return;
        }
        toast.success("Key revoked");
        await load();
    }

    async function rotate(key: ApiKeyRow) {
        if (!confirm(`Rotate "${key.name}"? The old key will be revoked.`))
            return;
        const res = await fetch(
            `/api/v2/developer/api-keys/${key.publicId}/rotate`,
            { method: "POST" }
        );
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Rotate failed");
            return;
        }
        setFreshKey(json.data);
        toast.success("Key rotated — copy the new secret now");
        await load();
    }

    async function rename(key: ApiKeyRow) {
        const next = prompt("Key name", key.name);
        if (!next?.trim()) return;
        const res = await fetch(`/api/v2/developer/api-keys/${key.publicId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: next.trim() }),
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Rename failed");
            return;
        }
        toast.success("Renamed");
        await load();
    }

    function toggleScope(scope: string) {
        setPermissions((prev) =>
            prev.includes(scope)
                ? prev.filter((s) => s !== scope)
                : [...prev, scope]
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex items-start gap-3">
                <Link
                    href="/settings"
                    className="rounded-md p-2 text-slate-400 hover:bg-white/[0.08]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Developer
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        API keys, webhooks, request logs, and the public REST
                        API explorer.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/settings/developer/explorer"
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20"
                >
                    API Explorer
                </Link>
                <Link
                    href="/settings/developer/webhooks"
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20"
                >
                    Webhooks
                </Link>
                <Link
                    href="/docs/developer"
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.08]"
                >
                    Documentation
                </Link>
                <button
                    type="button"
                    onClick={() => load()}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.08]"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {freshKey ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-sm font-semibold text-amber-300">
                        Copy your API key now — it won&apos;t be shown again.
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="flex-1 break-all rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white ring-1 ring-amber-500/20">
                            {freshKey.apiKey}
                        </code>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-500"
                            onClick={() => {
                                void navigator.clipboard.writeText(
                                    freshKey.apiKey
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
                        className="mt-3 text-sm text-amber-400 underline hover:text-amber-300"
                        onClick={() => setFreshKey(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            <SectionCard title="Create API key" icon={<Plus className="h-5 w-5" />}>
                <div className="space-y-4">
                    <label className="block text-sm text-slate-400">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white focus:border-indigo-500/50 focus:outline-none"
                        />
                    </label>
                    <label className="block text-sm text-slate-400">
                        Environment
                        <select
                            value={environment}
                            onChange={(e) =>
                                setEnvironment(e.target.value as "TEST" | "LIVE")
                            }
                            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white focus:border-indigo-500/50 focus:outline-none"
                        >
                            <option value="TEST">TEST (qz_test_…)</option>
                            <option value="LIVE">LIVE (qz_live_…)</option>
                        </select>
                    </label>
                    <div>
                        <p className="text-sm text-slate-400">Permissions</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {API_KEY_SCOPE_VALUES.map((scope) => (
                                <label
                                    key={scope}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300"
                                >
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(scope)}
                                        onChange={() => toggleScope(scope)}
                                    />
                                    {scope}
                                </label>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={creating || permissions.length === 0}
                        onClick={createKey}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", border: "1px solid rgba(99,102,241,0.3)" }}
                    >
                        {creating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <KeyRound className="h-4 w-4" />
                        )}
                        Generate key
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="API keys">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    </div>
                ) : keys.length === 0 ? (
                    <p className="text-sm text-slate-400">No API keys yet.</p>
                ) : (
                    <ul className="divide-y divide-white/[0.06]">
                        {keys.map((key) => (
                            <li
                                key={key.publicId}
                                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-medium text-white">
                                        {key.name}{" "}
                                        <span className="text-xs font-normal text-slate-400">
                                            {key.keyPrefix}…
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {key.environment}
                                        {key.revokedAt ? " · REVOKED" : ""} · Last
                                        used{" "}
                                        {key.lastUsedAt
                                            ? new Date(
                                                  key.lastUsedAt
                                              ).toLocaleString()
                                            : "never"}
                                        {key.expiresAt
                                            ? ` · Expires ${new Date(
                                                  key.expiresAt
                                              ).toLocaleString()}`
                                            : " · No expiry"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {key.permissions.join(", ")}
                                    </p>
                                </div>
                                {!key.revokedAt ? (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => rename(key)}
                                            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:bg-white/[0.08]"
                                        >
                                            Rename
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rotate(key)}
                                            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:bg-white/[0.08]"
                                        >
                                            Rotate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => revoke(key)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20"
                                        >
                                            <ShieldOff className="h-3 w-3" />
                                            Revoke
                                        </button>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard title="Recent API requests">
                {logs.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        No public API requests logged yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-2 pr-3">Time</th>
                                    <th className="py-2 pr-3">Key</th>
                                    <th className="py-2 pr-3">Method</th>
                                    <th className="py-2 pr-3">Endpoint</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2">Latency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="py-2 pr-3 text-xs text-slate-400">
                                            {new Date(
                                                log.createdAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {log.apiKeyName}
                                        </td>
                                        <td className="py-2 pr-3 font-mono text-xs">
                                            {log.method}
                                        </td>
                                        <td className="max-w-xs truncate py-2 pr-3 font-mono text-xs">
                                            {log.endpoint}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {log.statusCode}
                                        </td>
                                        <td className="py-2">{log.latencyMs}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
