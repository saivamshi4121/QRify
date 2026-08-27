"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Bell,
    Eye,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Send,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import {
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
} from "@/modules/notifications/constants";

type Template = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    channel: string;
    triggerEvent: string;
    enabled: boolean;
    subject: string;
    content: string;
    variables: string[];
};

type Delivery = {
    id: string;
    publicId: string;
    templateName: string;
    channel: string;
    status: string;
    recipient: string;
    triggerEvent: string;
    attempts: number;
    error: string | null;
    createdAt: string;
    renderedContent: string;
    subject: string;
};

export default function NotificationsSettingsClient() {
    const { status } = useSession();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [preview, setPreview] = useState<{
        subject: string;
        content: string;
    } | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
        null
    );

    const [name, setName] = useState("Custom template");
    const [channel, setChannel] = useState("email");
    const [triggerEvent, setTriggerEvent] = useState("attendee.created");
    const [subject, setSubject] = useState("Hello {{firstName}}");
    const [content, setContent] = useState(
        "Hi {{firstName}}, welcome to {{eventName}}."
    );

    const [filterChannel, setFilterChannel] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterEvent, setFilterEvent] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ deliveries: "1", limit: "40" });
            if (filterChannel) qs.set("channel", filterChannel);
            if (filterStatus) qs.set("status", filterStatus);
            if (filterEvent) qs.set("triggerEvent", filterEvent);
            if (search.trim()) qs.set("q", search.trim());

            const [t, d] = await Promise.all([
                fetch("/api/v2/developer/notifications").then((r) => r.json()),
                fetch(`/api/v2/developer/notifications?${qs}`).then((r) =>
                    r.json()
                ),
            ]);
            if (!t.success) throw new Error(t.message || "Failed to load");
            setTemplates(t.data || []);
            setDeliveries(d.success ? d.data?.items || [] : []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [filterChannel, filterStatus, filterEvent, search]);

    useEffect(() => {
        if (status === "authenticated") void load();
    }, [status, load]);

    async function createTemplate() {
        setCreating(true);
        try {
            const res = await fetch("/api/v2/developer/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    channel,
                    triggerEvent,
                    subject: channel === "email" ? subject : "",
                    content,
                    enabled: false,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Create failed");
            toast.success("Template created (disabled until you enable it)");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Create failed");
        } finally {
            setCreating(false);
        }
    }

    async function setEnabled(tpl: Template, enabled: boolean) {
        const res = await fetch(
            `/api/v2/developer/notifications/${tpl.publicId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            }
        );
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Update failed");
            return;
        }
        toast.success(enabled ? "Enabled" : "Disabled");
        await load();
    }

    async function runPreview(tpl?: Template) {
        const res = await fetch("/api/v2/developer/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "preview",
                subject: tpl?.subject ?? subject,
                content: tpl?.content ?? content,
                channel: tpl?.channel ?? channel,
                variables: {
                    firstName: "Ada",
                    lastName: "Lovelace",
                    email: "ada@example.com",
                    phone: "+15551234567",
                    eventName: "Demo Summit",
                    eventDate: new Date().toISOString(),
                    venue: "Main Hall",
                    credentialUrl: "https://example.com/ticket",
                    qrUrl: "https://example.com/qr",
                    checkInTime: new Date().toISOString(),
                    ticketType: "General",
                },
            }),
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Preview failed");
            return;
        }
        setPreview(json.data);
    }

    async function testSend(tpl: Template) {
        const recipient = prompt(
            tpl.channel === "email"
                ? "Send test email to:"
                : "Send test SMS/WhatsApp to phone:"
        );
        if (!recipient?.trim()) return;
        const res = await fetch("/api/v2/developer/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "test",
                templateId: tpl.publicId,
                recipient: recipient.trim(),
                variables: {
                    firstName: "Ada",
                    lastName: "Lovelace",
                    email: recipient.trim(),
                    phone: recipient.trim(),
                    eventName: "Demo Summit",
                    eventDate: new Date().toISOString(),
                    venue: "Main Hall",
                    credentialUrl: "https://example.com/ticket",
                    qrUrl: "https://example.com/qr",
                    ticketType: "General",
                },
            }),
        });
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Test send failed");
            return;
        }
        toast.success("Test queued (ConsoleProvider logs in server console)");
        await load();
    }

    async function retry(d: Delivery) {
        const res = await fetch(
            `/api/v2/developer/notifications/deliveries/${d.publicId}`,
            { method: "POST" }
        );
        const json = await res.json();
        if (!json.success) {
            toast.error(json.message || "Retry failed");
            return;
        }
        toast.success("Retry queued");
        await load();
    }

    const inputClass = "mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";
    const selectClass = "mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors appearance-none";

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" theme="dark" />
            <div className="flex items-start gap-3">
                <Link
                    href="/settings"
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Notifications
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Event-driven Email, SMS, and WhatsApp templates.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/docs/developer/notifications"
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                >
                    Documentation
                </Link>
                <button
                    type="button"
                    onClick={() => load()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            <SectionCard title="Create template" icon={<Plus className="h-5 w-5" />}>
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-300">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Channel
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value)}
                                className={selectClass}
                            >
                                {NOTIFICATION_CHANNEL_VALUES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-300">
                            Trigger
                            <select
                                value={triggerEvent}
                                onChange={(e) => setTriggerEvent(e.target.value)}
                                className={selectClass}
                            >
                                {NOTIFICATION_TRIGGER_EVENT_VALUES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {channel === "email" ? (
                        <label className="block text-sm font-medium text-slate-300">
                            Subject
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className={inputClass}
                            />
                        </label>
                    ) : null}
                    <label className="block text-sm font-medium text-slate-300">
                        Content
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className={`${inputClass} font-mono`}
                        />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={creating}
                            onClick={createTemplate}
                            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-60"
                            style={{
                                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                                border: "1px solid rgba(99,102,241,0.3)",
                            }}
                        >
                            {creating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bell className="h-4 w-4" />
                            )}
                            Create
                        </button>
                        <button
                            type="button"
                            onClick={() => runPreview()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </button>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Templates">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    </div>
                ) : templates.length === 0 ? (
                    <p className="text-sm text-slate-400">No templates yet.</p>
                ) : (
                    <ul className="divide-y divide-white/[0.06]">
                        {templates.map((tpl) => (
                            <li
                                key={tpl.publicId}
                                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-white">
                                        {tpl.name}{" "}
                                        <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                                            style={{
                                                background: tpl.enabled ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.08)",
                                                color: tpl.enabled ? "#34d399" : "#94a3b8",
                                                border: `1px solid ${tpl.enabled ? "rgba(52,211,153,0.2)" : "rgba(148,163,184,0.12)"}`,
                                            }}
                                        >
                                            {tpl.enabled ? "ON" : "OFF"}
                                        </span>
                                        <span className="ml-2 text-xs font-normal text-slate-500">
                                            {tpl.channel} · {tpl.triggerEvent}
                                        </span>
                                    </p>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        {tpl.description || tpl.subject}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEnabled(tpl, !tpl.enabled)}
                                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                                    >
                                        {tpl.enabled ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => runPreview(tpl)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => testSend(tpl)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                                    >
                                        <Send className="h-3 w-3" />
                                        Test
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard title="Delivery history">
                <div className="mb-4 flex flex-wrap gap-2">
                    <select
                        value={filterChannel}
                        onChange={(e) => setFilterChannel(e.target.value)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                    >
                        <option value="">All channels</option>
                        {NOTIFICATION_CHANNEL_VALUES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                    >
                        <option value="">All triggers</option>
                        {NOTIFICATION_TRIGGER_EVENT_VALUES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                    >
                        <option value="">All statuses</option>
                        {["PENDING", "PROCESSING", "DELIVERED", "FAILED", "RETRYING", "CANCELLED"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                    />
                </div>

                {deliveries.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        No deliveries yet. Enable a template and trigger an event.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="pb-3 pr-3">Time</th>
                                    <th className="pb-3 pr-3">Template</th>
                                    <th className="pb-3 pr-3">Channel</th>
                                    <th className="pb-3 pr-3">Recipient</th>
                                    <th className="pb-3 pr-3">Status</th>
                                    <th className="pb-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {deliveries.map((d) => (
                                    <tr key={d.publicId} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 pr-3 text-xs text-slate-400 tabular-nums">
                                            {new Date(d.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 pr-3 text-sm font-medium text-white">
                                            {d.templateName}
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
                                                style={{
                                                    background: "rgba(99,102,241,0.1)",
                                                    color: "#818cf8",
                                                    border: "1px solid rgba(99,102,241,0.2)",
                                                }}
                                            >
                                                {d.channel}
                                            </span>
                                        </td>
                                        <td className="max-w-[10rem] truncate py-3 pr-3 font-mono text-xs text-slate-300">
                                            {d.recipient}
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                                                style={{
                                                    background: d.status === "DELIVERED" ? "rgba(52,211,153,0.1)" : d.status === "FAILED" ? "rgba(244,63,94,0.1)" : "rgba(245,158,11,0.1)",
                                                    color: d.status === "DELIVERED" ? "#34d399" : d.status === "FAILED" ? "#f87171" : "#fbbf24",
                                                    border: `1px solid ${d.status === "DELIVERED" ? "rgba(52,211,153,0.2)" : d.status === "FAILED" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                                                }}
                                            >
                                                {d.status}
                                                {d.attempts ? ` · ${d.attempts}` : ""}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                                    onClick={() => setSelectedDelivery(d)}
                                                >
                                                    View
                                                </button>
                                                {d.status !== "DELIVERED" ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
                                                        onClick={() => retry(d)}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                        Retry
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {preview ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/[0.08] p-5"
                        style={{ background: "linear-gradient(160deg, #0f1423, #0a0e1c)" }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-white">Preview</h2>
                            <button
                                type="button"
                                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                                onClick={() => setPreview(null)}
                            >
                                Close
                            </button>
                        </div>
                        {preview.subject ? (
                            <p className="mb-2 text-sm font-medium text-slate-300">
                                Subject: {preview.subject}
                            </p>
                        ) : null}
                        <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-slate-200 font-mono">
                            {preview.content}
                        </pre>
                    </div>
                </div>
            ) : null}

            {selectedDelivery ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/[0.08] p-5"
                        style={{ background: "linear-gradient(160deg, #0f1423, #0a0e1c)" }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-white">
                                {selectedDelivery.publicId}
                            </h2>
                            <button
                                type="button"
                                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                                onClick={() => setSelectedDelivery(null)}
                            >
                                Close
                            </button>
                        </div>
                        {selectedDelivery.error ? (
                            <p className="mb-2 text-sm text-rose-400">
                                {selectedDelivery.error}
                            </p>
                        ) : null}
                        {selectedDelivery.subject ? (
                            <p className="mb-2 text-sm font-medium text-white">
                                {selectedDelivery.subject}
                            </p>
                        ) : null}
                        <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs font-mono text-slate-200">
                            {selectedDelivery.renderedContent}
                        </pre>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
