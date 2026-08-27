"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
    { id: "overview", title: "Overview" },
    { id: "auth", title: "Authentication" },
    { id: "signature", title: "Signature Verification" },
    { id: "retry", title: "Retry Policy" },
    { id: "replay", title: "Replay" },
    { id: "events", title: "Supported Events" },
    { id: "payload", title: "Example Payload" },
    { id: "verify", title: "Verification Examples" },
];

export default function WebhookDocsPage() {
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
                        Webhooks
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Receive signed HTTPS callbacks when events happen in
                        Qrezo Events.
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
                    Create an endpoint under{" "}
                    <Link
                        href="/settings/developer/webhooks"
                        className="text-indigo-400 hover:underline"
                    >
                        Settings → Developer → Webhooks
                    </Link>
                    , subscribe to event types, and Qrezo will POST a signed JSON
                    envelope to your URL asynchronously.
                </p>
            </section>

            <section id="auth" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Authentication
                </h2>
                <p className="text-sm text-slate-300">
                    Managing webhooks via API uses Bearer API keys with{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        webhooks:read
                    </code>{" "}
                    /{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        webhooks:write
                    </code>
                    . Incoming deliveries are authenticated with{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        X-Qrezo-Signature
                    </code>
                    , not API keys.
                </p>
            </section>

            <section id="signature" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Signature Verification
                </h2>
                <p className="text-sm text-slate-300">
                    Header format:{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        t=&lt;unix&gt;,v1=&lt;hex&gt;
                    </code>
                    . HMAC-SHA256 is computed over{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        `${"{timestamp}"}.${"{rawBody}"}`
                    </code>{" "}
                    using your endpoint secret. Reject requests older than 5
                    minutes to prevent replay.
                </p>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`X-Qrezo-Event: attendee.created
X-Qrezo-Delivery: whd_…
X-Qrezo-Timestamp: 1710000000
X-Qrezo-Signature: t=1710000000,v1=abc123…
User-Agent: Qrezo-Webhooks/1.0`}</pre>
            </section>

            <section id="retry" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Retry Policy
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                    <li>Non-2xx responses and network failures are retried</li>
                    <li>
                        Default delays: 1m → 5m → 15m → 1h → 6h (max 6 attempts)
                    </li>
                    <li>Statuses: PENDING, PROCESSING, RETRYING, DELIVERED, FAILED, CANCELLED</li>
                </ul>
            </section>

            <section id="replay" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Replay</h2>
                <p className="text-sm text-slate-300">
                    Replaying a delivery creates a <em>new</em> delivery record
                    with a new id while preserving history. Use the dashboard or{" "}
                    <code className="rounded bg-white/[0.06] px-1">
                        POST /api/v2/public/webhooks/deliveries/:id
                    </code>
                    .
                </p>
            </section>

            <section id="events" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Supported Events
                </h2>
                <pre className="overflow-auto rounded-lg bg-white/[0.03] p-4 text-xs text-slate-200">{`event.created | event.updated | event.deleted
attendee.created | attendee.updated | attendee.deleted
credential.generated | credential.regenerated | credential.revoked
access.granted | access.denied
scanner.paired | scanner.unpaired`}</pre>
            </section>

            <section id="payload" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Example Payload
                </h2>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`{
  "id": "whd_abc123",
  "type": "attendee.created",
  "createdAt": "2026-07-26T10:00:00.000Z",
  "workspaceId": "64f…",
  "data": {
    "eventId": "64f…",
    "id": "att_…",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com"
  }
}`}</pre>
            </section>

            <section id="verify" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">
                    Verification Examples
                </h2>
                <h3 className="font-medium text-slate-200">TypeScript / Node.js</h3>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`import crypto from "crypto";

function verify(secret: string, header: string, rawBody: string) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...r] = p.split("=");
      return [k, r.join("=")];
    })
  );
  const t = Number(parts.t);
  if (Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(parts.v1),
    Buffer.from(expected)
  );
}`}</pre>
                <h3 className="font-medium text-slate-200">Python</h3>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{`import hmac, hashlib, time

def verify(secret: str, header: str, raw_body: str) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    t = int(parts["t"])
    if abs(time.time() - t) > 300:
        return False
    expected = hmac.new(
        secret.encode(), f"{t}.{raw_body}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(parts["v1"], expected)`}</pre>
            </section>
        </div>
    );
}
