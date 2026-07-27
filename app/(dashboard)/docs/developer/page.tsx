"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
    { id: "start", title: "Getting Started" },
    { id: "auth", title: "Authentication" },
    { id: "keys", title: "API Keys" },
    { id: "webhooks", title: "Webhooks" },
    { id: "notifications", title: "Notifications" },
    { id: "rest", title: "REST API" },
    { id: "sdk", title: "SDK" },
    { id: "examples", title: "Examples" },
    { id: "errors", title: "Error Codes" },
    { id: "limits", title: "Rate Limits" },
    { id: "pagination", title: "Pagination" },
];

export default function DeveloperDocsPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-16">
            <div className="flex items-start gap-3">
                <Link
                    href="/settings/developer"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Developer documentation
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Build registration apps on Qrezo Events with API keys and
                        the TypeScript SDK.
                    </p>
                </div>
            </div>

            <nav className="flex flex-wrap gap-2">
                {SECTIONS.map((s) => (
                    <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        {s.title}
                    </a>
                ))}
            </nav>

            <section id="start" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Getting Started
                </h2>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    <li>
                        Open{" "}
                        <Link
                            href="/settings/developer"
                            className="text-indigo-600 hover:underline"
                        >
                            Settings → Developer
                        </Link>{" "}
                        and create a TEST API key.
                    </li>
                    <li>Copy the key once (qz_test_…).</li>
                    <li>Call the public REST API or install @qrezo/sdk.</li>
                </ol>
            </section>

            <section id="auth" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Authentication
                </h2>
                <p className="text-sm text-slate-700">
                    All public endpoints use Bearer API keys. Never send session
                    cookies.
                </p>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`Authorization: Bearer qz_live_xxxxxxxx`}</pre>
            </section>

            <section id="keys" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    API Keys
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    <li>Formats: qz_test_… and qz_live_…</li>
                    <li>Stored as SHA-256 hash + prefix only</li>
                    <li>Scopes: events, attendees, credentials, access, analytics, webhooks</li>
                    <li>Rotate or revoke anytime from the dashboard</li>
                </ul>
            </section>

            <section id="webhooks" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Webhooks
                </h2>
                <p className="text-sm text-slate-700">
                    Push signed domain events to your backend, n8n, Zapier, or
                    Make. See the full guide at{" "}
                    <Link
                        href="/docs/developer/webhooks"
                        className="text-indigo-600 hover:underline"
                    >
                        /docs/developer/webhooks
                    </Link>
                    .
                </p>
            </section>

            <section id="notifications" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Notifications
                </h2>
                <p className="text-sm text-slate-700">
                    Event-driven Email / SMS / WhatsApp templates. See{" "}
                    <Link
                        href="/docs/developer/notifications"
                        className="text-indigo-600 hover:underline"
                    >
                        /docs/developer/notifications
                    </Link>
                    .
                </p>
            </section>

            <section id="rest" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    REST API
                </h2>
                <pre className="overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">{`GET    /api/v2/public/events
POST   /api/v2/public/events
GET    /api/v2/public/events/:eventId
PATCH  /api/v2/public/events/:eventId
DELETE /api/v2/public/events/:eventId

GET    /api/v2/public/events/:eventId/attendees
POST   /api/v2/public/events/:eventId/attendees
GET    /api/v2/public/events/:eventId/attendees/:id
PATCH  /api/v2/public/events/:eventId/attendees/:id
DELETE /api/v2/public/events/:eventId/attendees/:id

POST   /api/v2/public/events/:eventId/attendees/:id/credential
POST   /api/v2/public/credentials/validate
POST   /api/v2/public/events/:eventId/access/validate
POST   /api/v2/public/events/:eventId/access/entry
POST   /api/v2/public/events/:eventId/access/exit
GET    /api/v2/public/events/:eventId/analytics`}</pre>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`curl -X POST https://app.qrezo.com/api/v2/public/events/EVENT_ID/attendees \\
  -H "Authorization: Bearer qz_test_…" \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","ticketType":"General"}'`}</pre>
            </section>

            <section id="sdk" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">SDK</h2>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`npm install @qrezo/sdk

import { Qrezo } from "@qrezo/sdk";

const client = new Qrezo({
  apiKey: process.env.QREZO_API_KEY!,
  baseUrl: "https://app.qrezo.com",
});

const attendee = await client.attendees.create(eventId, {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  ticketType: "General",
});

await client.credentials.generate(eventId, attendee.id);
await client.access.validate(eventId, { token, gate: "Main" });`}</pre>
            </section>

            <section id="examples" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Examples
                </h2>
                <p className="text-sm text-slate-700">
                    Full registration flow with the SDK:
                </p>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`const events = await client.events.list();
const eventId = events[0].id;

const attendee = await client.attendees.create(eventId, {
  firstName: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  ticketType: "VIP",
});

const credential = await client.credentials.generate(eventId, attendee.id);
// credential.token (or equivalent field) is what scanners validate

const result = await client.access.validate(eventId, {
  token: credential.token as string,
  gate: "Main Entrance",
  type: "ENTRY",
});

const stats = await client.analytics.overview(eventId);`}</pre>
            </section>

            <section id="errors" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Error Codes
                </h2>
                <pre className="overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">{`{
  "success": false,
  "error": {
    "code": "permission_denied",
    "message": "API key does not have attendees:write scope."
  }
}`}</pre>
                <p className="text-sm text-slate-600">
                    Common codes: unauthorized, permission_denied,
                    validation_error, not_found, rate_limit_exceeded,
                    internal_error.
                </p>
            </section>

            <section id="limits" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Rate Limits
                </h2>
                <ul className="list-disc pl-5 text-sm text-slate-700">
                    <li>TEST keys: 60 requests / minute</li>
                    <li>LIVE keys: 300 requests / minute</li>
                    <li>429 responses include Retry-After: 60</li>
                </ul>
            </section>

            <section id="pagination" className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">
                    Pagination & Search
                </h2>
                <p className="text-sm text-slate-700">
                    List attendees with <code className="rounded bg-slate-100 px-1">page</code>,{" "}
                    <code className="rounded bg-slate-100 px-1">limit</code>, and{" "}
                    <code className="rounded bg-slate-100 px-1">q</code> query
                    params. Responses include{" "}
                    <code className="rounded bg-slate-100 px-1">pagination</code>.
                </p>
            </section>
        </div>
    );
}
