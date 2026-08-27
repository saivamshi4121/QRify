"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
    { id: "overview", title: "Overview" },
    { id: "architecture", title: "Architecture" },
    { id: "providers", title: "Providers" },
    { id: "templates", title: "Templates" },
    { id: "variables", title: "Variables" },
    { id: "retry", title: "Retry" },
    { id: "events", title: "Supported Events" },
    { id: "api", title: "API Examples" },
];

export default function NotificationDocsPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-16">
            <div className="flex items-start gap-3">
                <Link
                    href="/docs/developer"
                    className="rounded-md p-2 text-slate-500 hover:bg-white/[0.06]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Notifications
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Provider-agnostic Email, SMS, and WhatsApp delivery
                        driven by domain events.
                    </p>
                </div>
            </div>

            <nav className="flex flex-wrap gap-2">
                {SECTIONS.map((s) => (
                    <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="rounded-full border border-white/[0.08] px-3 py-1 text-sm text-slate-400 hover:bg-white/[0.03]"
                    >
                        {s.title}
                    </a>
                ))}
            </nav>

            <section id="overview" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Overview
                </h2>
                <p className="text-sm text-slate-300">
                    Manage templates under{" "}
                    <Link
                        href="/settings/notifications"
                        className="text-indigo-400 hover:underline"
                    >
                        Settings → Notifications
                    </Link>
                    . Business services only call{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        publishDomainEvent()
                    </code>
                    ; notification infrastructure renders templates and delivers
                    asynchronously.
                </p>
            </section>

            <section id="architecture" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Architecture
                </h2>
                <pre className="overflow-auto rounded-lg bg-white/[0.06] p-4 text-xs text-slate-200">{`Business Event
  → publishDomainEvent()
  → Notification Module (match templates)
  → Render variables
  → Persist NotificationDelivery
  → Provider.send() (background)
  → Retry / Logs`}</pre>
            </section>

            <section id="providers" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Providers
                </h2>
                <p className="text-sm text-slate-300">
                    Default provider is{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        ConsoleProvider
                    </code>{" "}
                    (logs to the server console). Swap via{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        setNotificationProvider()
                    </code>{" "}
                    without changing business services. Channels: email, sms,
                    whatsapp (push-ready interface).
                </p>
            </section>

            <section id="templates" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Templates
                </h2>
                <p className="text-sm text-slate-300">
                    Starter templates are seeded per workspace (disabled by
                    default): Registration Confirmation, Credential Ready,
                    Credential Regenerated, Check-in Successful, Event Updated.
                </p>
            </section>

            <section id="variables" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Variables
                </h2>
                <pre className="overflow-auto rounded-lg bg-white/[0.06] p-4 text-xs text-slate-200">{`{{firstName}} {{lastName}} {{email}} {{phone}}
{{eventName}} {{eventDate}} {{venue}} {{ticketType}}
{{credentialUrl}} {{qrUrl}} {{checkInTime}}`}</pre>
                <p className="text-sm text-slate-400">
                    Missing variables render as empty strings.
                </p>
            </section>

            <section id="retry" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Retry</h2>
                <p className="text-sm text-slate-300">
                    Same schedule as webhooks: 1m → 5m → 15m → 1h → 6h (max 6
                    attempts). Cron:{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        /api/v2/cron/notifications/retries
                    </code>
                    .
                </p>
            </section>

            <section id="events" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Supported Events
                </h2>
                <pre className="overflow-auto rounded-lg bg-white/[0.06] p-4 text-xs text-slate-200">{`attendee.created
credential.generated
credential.regenerated
access.granted
event.updated
scanner.paired`}</pre>
            </section>

            <section id="api" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    API / SDK Examples
                </h2>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`import { Qrezo } from "@qrezo/sdk";

const client = new Qrezo({ apiKey: process.env.QREZO_API_KEY! });

const templates = await client.templates.list();
await client.templates.enable(templates[0].id);

await client.notifications.sendTest({
  templateId: templates[0].id,
  recipient: "you@example.com",
  variables: { firstName: "Ada", eventName: "Summit" },
});

const deliveries = await client.notifications.listDeliveries({
  status: "FAILED",
});`}</pre>
                <p className="text-sm text-slate-400">
                    Scopes:{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        notifications:read
                    </code>
                    ,{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        notifications:write
                    </code>
                    .
                </p>
            </section>
        </div>
    );
}
