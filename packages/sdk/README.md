# @qrezo/sdk

TypeScript client for the Qrezo Events public REST API. Works in Node.js, Next.js, and React (browser).

## Install

```bash
npm install @qrezo/sdk
# or from the monorepo
npm install ./packages/sdk
```

## Usage

```ts
import { Qrezo } from "@qrezo/sdk";

const client = new Qrezo({
  apiKey: process.env.QREZO_API_KEY!,
  baseUrl: "https://your-qrezo-host",
});

const attendee = await client.attendees.create(eventId, {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  ticketType: "General",
});

await client.credentials.generate(eventId, attendee.id);
await client.access.validate(eventId, { token, gate: "Main" });
const overview = await client.analytics.overview(eventId);
```

Authentication uses `Authorization: Bearer <API_KEY>` only — never session cookies.

## Resources

- `client.events` — list, get, create, update, delete
- `client.attendees` — list, get, create, update, delete
- `client.credentials` — generate, regenerate, revoke, restore, validate
- `client.access` — validate, entry, exit
- `client.analytics` — overview, attendance, access, credentials

Errors throw typed `QrezoError` subclasses (`QrezoAuthError`, `QrezoPermissionError`, `QrezoRateLimitError`, …).
