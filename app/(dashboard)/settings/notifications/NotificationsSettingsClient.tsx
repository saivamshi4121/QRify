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

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex items-start gap-3">
                <Link
                    href="/settings"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Notifications
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Event-driven Email, SMS, and WhatsApp templates.
                        Delivery uses ConsoleProvider in development.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/docs/developer/notifications"
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

            <SectionCard title="Create template" icon={<Plus className="h-5 w-5" />}>
                <div className="space-y-3">
                    <label className="block text-sm text-slate-600">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                        />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm text-slate-600">
                            Channel
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                            >
                                {NOTIFICATION_CHANNEL_VALUES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm text-slate-600">
                            Trigger
                            <select
                                value={triggerEvent}
                                onChange={(e) =>
                                    setTriggerEvent(e.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                            >
                                {NOTIFICATION_TRIGGER_EVENT_VALUES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {channel === "email" ? (
                        <label className="block text-sm text-slate-600">
                            Subject
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                            />
                        </label>
                    ) : null}
                    <label className="block text-sm text-slate-600">
                        Content
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
                        />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={creating}
                            onClick={createTemplate}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm"
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
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                ) : templates.length === 0 ? (
                    <p className="text-sm text-slate-500">No templates yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {templates.map((tpl) => (
                            <li
                                key={tpl.publicId}
                                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                        {tpl.name}{" "}
                                        <span className="text-xs font-normal text-slate-400">
                                            {tpl.enabled ? "ON" : "OFF"} ·{" "}
                                            {tpl.channel} · {tpl.triggerEvent}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {tpl.description || tpl.subject}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEnabled(tpl, !tpl.enabled)
                                        }
                                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs"
                                    >
                                        {tpl.enabled ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => runPreview(tpl)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => testSend(tpl)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs"
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
                <div className="mb-3 flex flex-wrap gap-2">
                    <select
                        value={filterChannel}
                        onChange={(e) => setFilterChannel(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                        <option value="">All channels</option>
                        {NOTIFICATION_CHANNEL_VALUES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                        <option value="">All triggers</option>
                        {NOTIFICATION_TRIGGER_EVENT_VALUES.map((t) => (
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
                        No deliveries yet. Enable a template and trigger an
                        event.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2 pr-3">Time</th>
                                    <th className="py-2 pr-3">Template</th>
                                    <th className="py-2 pr-3">Channel</th>
                                    <th className="py-2 pr-3">Recipient</th>
                                    <th className="py-2 pr-3">Status</th>
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
                                            {d.templateName}
                                        </td>
                                        <td className="py-2 pr-3">{d.channel}</td>
                                        <td className="max-w-[10rem] truncate py-2 pr-3 font-mono text-xs">
                                            {d.recipient}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {d.status}
                                            {d.attempts
                                                ? ` · ${d.attempts}`
                                                : ""}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="text-xs text-indigo-600 hover:underline"
                                                    onClick={() =>
                                                        setSelectedDelivery(d)
                                                    }
                                                >
                                                    View
                                                </button>
                                                {d.status !== "DELIVERED" ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-0.5 text-xs text-slate-600 hover:underline"
                                                        onClick={() =>
                                                            retry(d)
                                                        }
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                Preview
                            </h2>
                            <button
                                type="button"
                                className="text-sm text-slate-500"
                                onClick={() => setPreview(null)}
                            >
                                Close
                            </button>
                        </div>
                        {preview.subject ? (
                            <p className="mb-2 text-sm font-medium text-slate-800">
                                Subject: {preview.subject}
                            </p>
                        ) : null}
                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                            {preview.content}
                        </pre>
                    </div>
                </div>
            ) : null}

            {selectedDelivery ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                {selectedDelivery.publicId}
                            </h2>
                            <button
                                type="button"
                                className="text-sm text-slate-500"
                                onClick={() => setSelectedDelivery(null)}
                            >
                                Close
                            </button>
                        </div>
                        {selectedDelivery.error ? (
                            <p className="mb-2 text-sm text-red-600">
                                {selectedDelivery.error}
                            </p>
                        ) : null}
                        {selectedDelivery.subject ? (
                            <p className="mb-2 text-sm font-medium">
                                {selectedDelivery.subject}
                            </p>
                        ) : null}
                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                            {selectedDelivery.renderedContent}
                        </pre>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
