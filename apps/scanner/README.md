# Qrezo Scanner

Mobile-first gate scanner for volunteers. Separate app from the main Qrezo dashboard.

## Local development

1. Start the main Qrezo API (port 3000):
   ```bash
   npm run dev
   ```

2. Start the scanner (port 3001):
   ```bash
   npm run dev:scanner
   ```

3. Open http://localhost:3001

## Pairing flow (default)

1. In the dashboard: Event → **Scanner devices** → Generate pairing code
2. On the scanner: **Pair Scanner** → enter 6-digit code (or scan pairing QR)
3. Choose gate → start scanning

No email/password required for volunteers.

## Staff login

Organizers can use **Staff Login** (email/password), then pick workspace / event / gate. This still creates a dedicated scanner device session (not organizer credentials on the device).

## Environment

Copy `.env.example` to `.env.local` in this folder.

- `NEXTAUTH_SECRET` — **must match** the main app (staff login + scanner JWT fallback)
- `MONGODB_URI` — same database as main app
- `QREZO_API_URL` — main app origin (default `http://localhost:3000`)

On the main app, optionally set:

- `NEXT_PUBLIC_SCANNER_URL` / `SCANNER_PUBLIC_URL` — used in pairing QR payloads (default `http://localhost:3001`)
- `SCANNER_TOKEN_SECRET` — optional dedicated secret for scanner JWTs (falls back to `NEXTAUTH_SECRET`)

## Production

Deploy to `scanner.qrezo.com`. Point `QREZO_API_URL` at the main API host.
