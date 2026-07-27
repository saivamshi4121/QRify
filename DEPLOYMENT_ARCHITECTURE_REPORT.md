# Qrezo — Deployment Architecture Report

> **Status:** Read-only audit. No files were modified.
> **Scope:** `apps/scanner` deployment to Vercel as an independent project.
> **Date:** 2026-07-27

---

## 1. Repository Structure

```
smart-qr-saas/                          ← Root / Main Dashboard App (Next.js 16)
├── app/                                ← Dashboard app router (pages, layouts, API routes)
│   ├── (dashboard)/                    ← Authenticated dashboard group
│   ├── (public)/                       ← Public-facing pages
│   └── api/                            ← Dashboard API routes (/api/v2/...)
├── apps/                               ← Sub-applications
│   └── scanner/                        ← ★ Scanner App (Next.js 16, port 3001)
│       ├── app/
│       │   ├── (staff)/                ← Staff login & setup wizard
│       │   │   ├── layout.tsx
│       │   │   ├── login/
│       │   │   └── setup/page.tsx      ← Workspace → Event → Gate wizard
│       │   ├── api/
│       │   │   ├── auth/
│       │   │   │   ├── [...nextauth]/route.ts   ← Scanner NextAuth handler
│       │   │   │   └── session/route.ts
│       │   │   └── proxy/
│       │   │       └── [...path]/route.ts       ← ★ API proxy to main app
│       │   ├── gate/page.tsx
│       │   ├── pair/
│       │   │   ├── PairClient.tsx      ← QR + code pairing UI
│       │   │   └── page.tsx
│       │   ├── scan/page.tsx           ← Active scanning screen
│       │   ├── settings/
│       │   ├── globals.css
│       │   ├── layout.tsx              ← PWA metadata, viewport lock
│       │   └── page.tsx                ← Home / route guard
│       ├── components/
│       │   ├── Providers.tsx
│       │   └── ScannerView.tsx         ← Core camera + scan result UI (618 lines)
│       ├── lib/
│       │   ├── User.ts                 ← Mongoose User model (local copy)
│       │   ├── api.ts                  ← API helpers + proxy calls
│       │   ├── auth.ts                 ← NextAuth CredentialsProvider config
│       │   ├── dbConnect.ts            ← Mongoose connection (MongoDB)
│       │   ├── selection.ts            ← localStorage gate selection
│       │   └── session.ts              ← localStorage scanner token session
│       ├── types/
│       │   └── next-auth.d.ts
│       ├── .env.example
│       ├── .env.local                  ← Contains real secrets (3 vars)
│       ├── middleware.ts               ← NextAuth guard on /setup/**
│       ├── next.config.ts
│       ├── package.json                ← Standalone deps, no workspace refs
│       ├── package-lock.json           ← Own lockfile
│       └── tsconfig.json
├── components/                         ← Shared UI components (dashboard only)
├── config/                             ← App config
├── core/                               ← Core platform services
├── hooks/                              ← React hooks (dashboard)
├── lib/                                ← Shared library (dashboard)
├── models/                             ← Mongoose models (dashboard)
├── modules/                            ← Feature modules (dashboard)
├── packages/
│   └── sdk/                            ← @qrezo/sdk — TypeScript client SDK
│       ├── src/
│       ├── dist/
│       └── package.json                ← name: "@qrezo/sdk"
├── services/                           ← External service clients (dashboard)
├── types/                              ← Global type declarations (dashboard)
├── next.config.ts                      ← Root (dashboard) Next.js config
└── package.json                        ← Root scripts (includes dev:scanner, build:scanner)
```

**Identity of key locations:**

| Role | Path |
|------|------|
| Main Dashboard App | `./` (root) |
| Scanner App | `./apps/scanner/` |
| Shared SDK Package | `./packages/sdk/` |
| Shared Modules (dashboard only) | `./modules/` |
| Shared Components (dashboard only) | `./components/` |
| Shared Libraries (dashboard only) | `./lib/`, `./core/`, `./services/` |
| Shared Models (dashboard only) | `./models/` |

---

## 2. Monorepo Detection

**Classification: Custom Multi-App Repository (not a standard monorepo toolchain)**

**Evidence:**

| Signal | Finding |
|--------|---------|
| `package.json` → `workspaces` field | ❌ Not present |
| `pnpm-workspace.yaml` | ❌ Not found |
| `turbo.json` | ❌ Not found |
| `nx.json` / `project.json` | ❌ Not found |
| `lerna.json` | ❌ Not found |
| `yarn.lock` at root | ❌ Not found |
| Root `package.json` scripts | ✅ `--prefix apps/scanner` convention |
| Scanner `package-lock.json` | ✅ Own lockfile inside `apps/scanner/` |
| Scanner `node_modules/` | ✅ Own node_modules inside `apps/scanner/` |

**Conclusion:** This is a **plain multi-app repository** coordinated via npm `--prefix` scripts. There is no workspace protocol, no package hoisting, and no build pipeline tool (Turborepo, Nx, etc.). The scanner app is simply nested inside `apps/scanner/` and manages its own dependencies entirely independently.

---

## 3. Applications

| Application | Location | Framework | Entry Point | Build Target | Port |
|-------------|----------|-----------|-------------|--------------|------|
| Qrezo Dashboard | `./` | Next.js 16 | `app/` | `next build` | 3000 |
| Qrezo Scanner | `apps/scanner/` | Next.js 16 | `app/` | `next build` (inside scanner) | 3001 |
| Qrezo SDK | `packages/sdk/` | TypeScript lib | `src/` | `tsc` → `dist/` | N/A |

---

## 4. Scanner Analysis

### `apps/scanner/package.json`

```json
{
  "name": "qrezo-scanner",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "html5-qrcode": "^2.3.8",
    "mongoose": "^9.0.1",
    "next": "16.0.7",
    "next-auth": "^4.24.13",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zod": "^4.4.3"
  }
}
```

**Key observations:**
- Has its **own separate `package-lock.json`** and **own `node_modules/`**.
- Has **no reference** to root `node_modules/` or workspace packages.
- Does **not** list `@qrezo/sdk` or any `packages/*` as a dependency.

### `apps/scanner/next.config.ts`

```ts
const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,   // ⚠️ Allows reading files outside the app root
  },
  turbopack: {
    root: path.join(__dirname),   // Turbopack root set to scanner's own dir
  },
};
```

> ⚠️ **`externalDir: true`** is set. This was needed in development to potentially reference files outside `apps/scanner/`. It is worth investigaing whether removal breaks anything on Vercel (Turbopack builds will ignore it anyway in production mode with webpack).

### `apps/scanner/tsconfig.json`

```json
{
  "paths": {
    "@/*": ["./*"]   // ← resolves to apps/scanner/*, NOT the root
  }
}
```

The `@/` alias maps strictly to `apps/scanner/` itself. There are **no cross-root imports** in tsconfig.

### Imports — All internal to `apps/scanner/`

Every file in `apps/scanner/` imports **only** from:
- `@/lib/...` → `apps/scanner/lib/`
- `@/components/...` → `apps/scanner/components/`
- npm packages (`next`, `next-auth`, `react`, `html5-qrcode`, `mongoose`, `bcryptjs`, `zod`)

**No file imports from the root app**, `modules/`, `components/`, `lib/`, `models/`, or `packages/sdk/`.

### Does it run independently?

✅ **Yes.** The scanner:
- Has its own `package.json` + lockfile
- Has its own `node_modules/`
- Has its own `next.config.ts`
- Has its own `.env.local`
- All source references use self-contained `@/*` paths

### Does it depend on the root app at runtime?

⚠️ **Yes — via HTTP proxy.** At runtime, the scanner **cannot function** without the main Qrezo API being reachable. The `QREZO_API_URL` env variable must point to a live, deployed instance of the main dashboard app. All scanner API calls (pairing, access validation, heartbeat) are proxied through `apps/scanner/app/api/proxy/[...path]/route.ts`.

---

## 5. Shared Code

**Files imported by scanner from outside `apps/scanner/`:**

| Import | Files that import it | Status |
|--------|---------------------|--------|
| Root `components/*` | None | ✅ Not used |
| Root `modules/*` | None | ✅ Not used |
| Root `lib/*` | None | ✅ Not used |
| Root `models/*` | None | ✅ Not used |
| Root `core/*` | None | ✅ Not used |
| `packages/sdk` (`@qrezo/sdk`) | None | ✅ Not used |

**Conclusion:** The scanner has **zero source-level imports from outside its own directory**. All shared functionality is duplicated locally:

| Shared concept | Scanner's local copy |
|----------------|---------------------|
| Mongoose User model | `apps/scanner/lib/User.ts` |
| MongoDB connection | `apps/scanner/lib/dbConnect.ts` |
| NextAuth config | `apps/scanner/lib/auth.ts` |

This duplication means the scanner is **fully self-contained at the source level**. It is 100% compatible with separate deployment with no monorepo tooling needed.

---

## 6. Environment Variables

All environment variables found in `apps/scanner/`:

| Variable | Required? | Where Used | Purpose | Safe for Client? |
|----------|-----------|-----------|---------|-----------------|
| `NEXTAUTH_SECRET` | ✅ Yes | `lib/auth.ts`, NextAuth internally | Signs/verifies JWT session tokens for staff login. **Must match** main app secret. | ❌ No — server only |
| `NEXTAUTH_URL` | ✅ Yes | NextAuth internally | Base URL of the scanner app itself (e.g. `https://scanner.qrezo.com`) | ❌ No — server only |
| `MONGODB_URI` | ✅ Yes | `lib/dbConnect.ts` | MongoDB Atlas connection string. Same DB as main app. Used only for staff login (user credential lookup). | ❌ No — server only |
| `QREZO_API_URL` | ✅ Yes | `app/api/proxy/[...path]/route.ts` | Base URL of the main Qrezo Dashboard API. All scanner API calls are proxied to this URL. | ❌ No — server only |
| `FORCE_IPV4_DNS` | ⬜ Optional | `lib/dbConnect.ts` | Forces IPv4 DNS resolution for MongoDB Atlas in environments with IPv6 issues. | ❌ No — server only |
| `NODE_ENV` | Auto | `app/api/proxy/[...path]/route.ts` | Determines which NextAuth cookie name to use (`__Secure-` prefix in production) | ❌ No — server only |
| `NEXT_PUBLIC_SCANNER_URL` | ⬜ Optional | Main app (not scanner) | Embedded in pairing QR codes as the scanner's public URL. Set on the **main app**, not the scanner. | ✅ Yes — public env var |
| `SCANNER_PUBLIC_URL` | ⬜ Optional | Main app (not scanner) | Fallback alias for `NEXT_PUBLIC_SCANNER_URL`. Set on the **main app**. | ✅ Yes — public env var |
| `SCANNER_TOKEN_SECRET` | ⬜ Optional | Main app (not scanner) | Dedicated HMAC secret for signing scanner JWTs. Falls back to `NEXTAUTH_SECRET`. Set on the **main app**. | ❌ No — server only |

> **Important:** The scanner itself has **no `NEXT_PUBLIC_` variables**. Only the main app has environment variables that affect the scanner's external URL (embedded in pairing QR codes).

---

## 7. API Usage

All scanner API calls go through the **internal proxy** at `/api/proxy/[...path]`. The proxy prepends `/api/v2/` and forwards to `QREZO_API_URL`.

### Endpoints called (proxy path → resolved target):

| Scanner calls | Resolved API path | Method | Auth mechanism | Called from |
|--------------|-------------------|--------|----------------|-------------|
| `/api/proxy/scanner/pair` | `POST /api/v2/scanner/pair` | POST | None (public pairing endpoint) | `lib/api.ts → pairWithCode()` |
| `/api/proxy/scanner/staff-session` | `POST /api/v2/scanner/staff-session` | POST | NextAuth session cookie | `lib/api.ts → createStaffScannerSession()` |
| `/api/proxy/scanner/access/validate` | `POST /api/v2/scanner/access/validate` | POST | Scanner JWT Bearer token | `components/ScannerView.tsx` |
| `/api/proxy/scanner/heartbeat` | `POST /api/v2/scanner/heartbeat` | POST | Scanner JWT Bearer token | `components/ScannerView.tsx` (every 45s) |
| `/api/proxy/workspaces` | `GET /api/v2/workspaces` | GET | NextAuth session cookie | `app/(staff)/setup/page.tsx` |
| `/api/proxy/events?status=PUBLISHED&sort=startDate_asc` | `GET /api/v2/events` | GET | NextAuth session cookie + workspace header | `app/(staff)/setup/page.tsx` |

**Request style:** All requests are **relative** to the scanner app itself (`/api/proxy/...`). The proxy server-side resolves them to the absolute `QREZO_API_URL`. There are **no hardcoded absolute URLs** in client-side scanner code.

---

## 8. Authentication

The scanner has **two distinct authentication mechanisms** operating in parallel:

### Mechanism 1: Scanner Token (Primary — used by volunteers)

- **Flow:** Dashboard organizer generates a 6-digit pairing code → Volunteer enters code on scanner → Scanner calls `POST /api/v2/scanner/pair` → Main API returns a signed JWT scanner token
- **Storage:** Stored in **`localStorage`** under key `qrezo.scanner.session.v2` as a `ScannerSession` object containing `{ token, deviceId, workspaceId, eventId, gate, ... }`
- **Transmission:** Sent as `Authorization: Bearer <token>` header on all scanning API calls (`validate`, `heartbeat`)
- **Signing:** JWT signed by the main app using `SCANNER_TOKEN_SECRET` (or `NEXTAUTH_SECRET` as fallback)
- **No cookies** — entirely localStorage-based. This is intentional: volunteers do not log in.
- **Session type:** `ScannerSession` (custom type, not NextAuth session)

### Mechanism 2: NextAuth Staff Login (Secondary — used by organizers)

- **Flow:** Staff member logs in with email/password at `/login` → NextAuth CredentialsProvider validates against MongoDB → JWT session cookie set
- **Storage:** NextAuth JWT stored in HTTP-only cookie (`next-auth.session-token` or `__Secure-next-auth.session-token` in production)
- **Used for:** `/setup` page only (middleware enforces auth on `/setup/**`). Staff then creates a scanner device session which issues a Scanner Token (Mechanism 1).
- **Database:** Scanner has its own `dbConnect.ts` + `User.ts` model connecting to the same MongoDB database as the main app
- **The `NEXTAUTH_SECRET` must match** the main app's secret exactly

### Proxy cookie forwarding

The proxy route (`apps/scanner/app/api/proxy/[...path]/route.ts`) extracts the NextAuth session cookie from the incoming request and forwards it to the main API as a `Cookie` header. This is how the main API authenticates staff-originated scanner requests.

---

## 9. Build Configuration

### Scanner — Correct Vercel Settings

| Setting | Value |
|---------|-------|
| **Project Name** | `qrezo-scanner` (or `scanner-qrezo`) |
| **Framework** | Next.js |
| **Root Directory** | `apps/scanner` |
| **Build Command** | `next build` *(Vercel detects Next.js and runs this automatically)* |
| **Install Command** | `npm install` *(run inside `apps/scanner/`)* |
| **Output Directory** | `.next` *(Next.js default — leave blank)* |
| **Node.js Version** | 20.x *(matches `@types/node: ^20` and `engines: >=18` in SDK)* |

> Vercel will `cd` into the **Root Directory** before running install and build — this is why set `apps/scanner` as root, not `./`.

---

## 10. Deployment Dependencies

| Dependency type | Does scanner need it? | Notes |
|----------------|----------------------|-------|
| Shared workspace packages | ❌ No | Scanner has no npm workspace refs |
| Workspace configuration | ❌ No | No `workspaces` field in root package.json |
| Root lockfile | ❌ No | Scanner has its own `package-lock.json` |
| Root `node_modules/` | ❌ No | Scanner has its own `node_modules/` |
| Transpilation of shared packages | ❌ No | No local package imports |
| TypeScript path aliases from root | ❌ No | Scanner's `@/*` → `apps/scanner/*` only |
| `externalDir: true` in next.config | ⚠️ Present | Set in scanner's `next.config.ts` but has no effect if there are no actual cross-directory imports. Non-breaking on Vercel. |
| Turbopack root config | ⚠️ Present | `turbopack.root = __dirname` — this is fine, it just sets the Turbopack root to `apps/scanner/` itself |
| `packages/sdk/` | ❌ No | Scanner does not import `@qrezo/sdk` |

---

## 11. Vercel Compatibility

### ✅ `apps/scanner` CAN be deployed as an independent Vercel project

**Reasons:**

1. **Self-contained package graph** — own `package.json`, `package-lock.json`, `node_modules/`, and `tsconfig.json`. No workspace hoisting required.
2. **Zero cross-boundary source imports** — no file inside `apps/scanner/` imports from the root app, `modules/`, `components/`, `lib/`, `models/`, or `packages/`.
3. **Standard Next.js structure** — Vercel's Next.js buildpack works out-of-the-box when `Root Directory` is set to `apps/scanner`.
4. **Own lockfile** — Vercel can install dependencies without needing to process the root `package-lock.json`.
5. **All environment variables are server-side** — no client-exposed secrets, no special environment handling beyond standard `process.env` usage.
6. **Runtime coupling is via HTTP only** — the scanner talks to the main app over `QREZO_API_URL`, which is a standard runtime environment variable.

---

## 12. Deployment Checklist

### Vercel Project Setup

| Setting | Exact Value |
|---------|-------------|
| **Project Name** | `qrezo-scanner` |
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/scanner` |
| **Build Command** | *(leave blank — Vercel uses `next build` automatically)* |
| **Install Command** | *(leave blank — Vercel uses `npm install` automatically)* |
| **Output Directory** | *(leave blank — Vercel uses `.next` automatically)* |
| **Node.js Version** | 20.x |

### Environment Variables (set in Vercel Dashboard)

| Variable | Example Value | Environment |
|----------|--------------|-------------|
| `NEXTAUTH_SECRET` | `<same value as main app>` | Production, Preview |
| `NEXTAUTH_URL` | `https://scanner.qrezo.com` | Production |
| `NEXTAUTH_URL` | `https://qrezo-scanner-git-*.vercel.app` | Preview |
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview |
| `QREZO_API_URL` | `https://app.qrezo.com` | Production |
| `QREZO_API_URL` | `https://qrezo-dashboard-git-*.vercel.app` | Preview |
| `FORCE_IPV4_DNS` | `true` *(if MongoDB Atlas DNS issues occur)* | Optional |

### On the Main Dashboard App (add these)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SCANNER_URL` | `https://scanner.qrezo.com` | Embedded in pairing QR code payloads |
| `SCANNER_TOKEN_SECRET` | `<dedicated secret>` | Sign scanner JWTs independently from NextAuth |

---

## 13. Potential Problems

| # | Problem | Severity | Detail |
|---|---------|----------|--------|
| 1 | **`NEXTAUTH_SECRET` mismatch** | 🔴 Critical | The scanner's NextAuth and the scanner JWT validation in the main app both depend on `NEXTAUTH_SECRET` (unless `SCANNER_TOKEN_SECRET` is set). If the values differ, staff login will fail and scanner tokens may be rejected. |
| 2 | **`QREZO_API_URL` not set or wrong** | 🔴 Critical | The proxy route hard-codes a fallback to `http://localhost:3000`. In production, if this env var is missing, every API call from the scanner will fail with a 503. |
| 3 | **`NEXTAUTH_URL` must be set correctly per environment** | 🟠 High | NextAuth uses this to construct callback URLs. In Vercel Preview deployments the URL changes per branch. Must be set dynamically (Vercel supports `VERCEL_URL` for this). |
| 4 | **`externalDir: true` in `next.config.ts`** | 🟡 Medium | This option exists in the scanner's `next.config.ts` but serves no function since there are no actual cross-directory imports. It is harmless but should be removed to avoid confusion. It does not block Vercel deployment. |
| 5 | **`output: "standalone"` is on the root app, NOT the scanner** | 🟡 Medium | The root app has `output: "standalone"` which is fine for its own deployment. The scanner does NOT have this, which is correct for Vercel (Vercel handles output automatically). No action needed. |
| 6 | **MongoDB URI in scanner connects to same DB as main app** | 🟡 Medium | The scanner reads the `users` collection directly for staff login. If schemas drift or collection names change in the main app model, the scanner's local `User.ts` model would need to be updated separately. |
| 7 | **No CORS config on main API** | 🟡 Medium | The scanner proxy runs server-side so cross-origin browser issues do not apply. However, if direct API calls are ever added (without going through the proxy), CORS headers would need to be set on the main app's API routes. |
| 8 | **Pairing QR codes require `NEXT_PUBLIC_SCANNER_URL` on main app** | 🟡 Medium | Without this variable set on the main dashboard, pairing QR codes generated by the dashboard will contain `http://localhost:3001` as the scanner URL, which will not work in production. |
| 9 | **`html5-qrcode` requires camera permission** | 🟢 Low | This is an expected user-permission requirement (not a deployment issue), but the scanner must be served over HTTPS for the browser camera API to work. Vercel enforces HTTPS, so this is automatically satisfied. |
| 10 | **Vercel Preview deployments will have dynamic URLs** | 🟢 Low | `NEXTAUTH_URL` and `QREZO_API_URL` must both be environment-specific. For Preview builds, use `VERCEL_URL` system env variable in `NEXTAUTH_URL`. |

---

## 14. Final Recommendation

### Can scanner be deployed separately?
✅ **Yes, immediately.** The scanner app is already architecturally self-contained with its own package manifest, lockfile, dependencies, and TypeScript configuration. No structural refactoring is required before deploying.

### Can the dashboard remain separate?
✅ **Yes.** The dashboard (root app) and scanner have no build-time or source-level coupling. They communicate only via the HTTP proxy at runtime. Both can be deployed independently on the same or different Vercel teams/organizations.

### Should both share the same backend?
✅ **Yes — they already do.** The scanner is designed to proxy all its API calls to the main dashboard's API (`/api/v2/*`). They also share the same MongoDB database. This shared backend model is the correct architecture for this use case.

### Should scanner have its own domain?
✅ **Yes — strongly recommended.** The README explicitly documents this: `scanner.qrezo.com`. Using a dedicated subdomain:

- Allows setting `NEXTAUTH_URL` predictably (no dynamic Vercel URL)
- Enables a PWA manifest and app icon without conflicting with the dashboard
- Allows independent scaling and deployment cadence
- Keeps cookie namespaces clean (`__Secure-next-auth.session-token` is scoped per domain)

### What is the recommended production architecture?

```
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│   Vercel Project: qrezo-dashboard   │     │   Vercel Project: qrezo-scanner     │
│   Domain: app.qrezo.com             │     │   Domain: scanner.qrezo.com         │
│   Root Dir: ./                      │     │   Root Dir: apps/scanner            │
│   Next.js 16 (standalone)           │     │   Next.js 16                        │
│   Port: 443 (HTTPS)                 │     │   Port: 443 (HTTPS)                 │
└───────────────┬─────────────────────┘     └────────────────┬────────────────────┘
                │                                            │
                │  All /api/v2/* routes                      │  QREZO_API_URL=
                │  (events, attendees, scanner/*)            │  https://app.qrezo.com
                │                                            │
                ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MongoDB Atlas (shared database)                         │
│   users, workspaces, events, attendees, scanner_devices, access_events          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Three action items before deploying scanner to Vercel:**

1. Set all four environment variables on the Vercel scanner project (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MONGODB_URI`, `QREZO_API_URL`)
2. Set `NEXT_PUBLIC_SCANNER_URL=https://scanner.qrezo.com` on the main dashboard Vercel project so pairing QR codes point to the correct URL
3. Verify `NEXTAUTH_SECRET` is identical between both projects (or set `SCANNER_TOKEN_SECRET` on the main app to decouple them)
