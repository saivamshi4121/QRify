# 18. Implementation Roadmap & Sprint Plan: Qrezo v2

## 1. Executive Implementation Strategy

The transition from Qrezo v1 to Qrezo v2 is structured into **6 Sequential Engineering Phases** spanning **20 Weeks**. The plan follows a zero-downtime execution methodology, ensuring existing v1 dynamic QR redirects continue operating seamlessly while v2 infrastructure is deployed.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        20-Week Master Timeline                         │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Foundation & Workspace Refactor       [Weeks 01 - 04]         │
│ Phase 2: SmartPage & Block Builder Engine      [Weeks 05 - 08]         │
│ Phase 3: Restaurant Feedback Vertical Engine   [Weeks 09 - 12]         │
│ Phase 4: Notification Router & Webhook Layer   [Weeks 13 - 15]         │
│ Phase 5: AI Insights & Developer SDK           [Weeks 16 - 18]         │
│ Phase 6: Enterprise Scale & GA Launch          [Weeks 19 - 20]         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Sprint Phase Breakdown

### Phase 1: Modular Foundation & Workspace Schema (Weeks 1 - 4)
- **Sprint 1.1 (W1-W2):**
  - Implement `Workspace`, `WorkspaceMember`, and `User` schema updates.
  - Fix critical v1 bugs (BOLA vulnerability in `/api/dashboard/overview`, ScanLog delete field bug).
  - Deploy `TenantScopedRepository` base class for database multi-tenancy.
- **Sprint 1.2 (W3-W4):**
  - Implement Workspace switcher UI in dashboard header.
  - Implement Team Member invitation flow with tokenized email links.
  - Add Role-Based Access Control (RBAC) middleware guards.

---

### Phase 2: SmartPage & Block System (Weeks 5 - 8)
- **Sprint 2.1 (W5-W6):**
  - Build `SmartPage` and `Block` Mongoose database schemas.
  - Develop core Block Registry (`header`, `rating`, `google_review`, `feedback_form`).
  - Implement server-rendered public micro-landing runtime `/p/[slug]`.
- **Sprint 2.2 (W7-W8):**
  - Build drag-and-drop SmartPage Canvas Builder UI using `@dnd-kit`.
  - Implement Zustand state store for local page editing, previewing, and publishing.
  - Implement Cloudinary image upload integration for block logos and hero media.

---

### Phase 3: Restaurant Feedback Vertical Engine (Weeks 9 - 12)
- **Sprint 3.1 (W9-W10):**
  - Build `FeedbackResponse` database model and submission route `/api/v2/feedback/submit`.
  - Implement conditional routing engine (Star Rating $\ge 4 \rightarrow$ Google Review; $\le 3 \rightarrow$ Private Form).
  - Implement dynamic URL table metadata ingestion (`?table=14&zone=patio`).
- **Sprint 3.2 (W11-W12):**
  - Build Incident Management Board UI in Dashboard (New, Acknowledged, Resolved).
  - Implement manager resolution audit log and response metrics.
  - Implement table-level rating performance analytics charts via Recharts.

---

### Phase 4: Multi-Channel Notification Router (Weeks 13 - 15)
- **Sprint 4.1 (W13-W14):**
  - Integrate Meta WhatsApp Cloud API / Twilio WhatsApp client.
  - Build `NotificationRule` engine triggering alerts on $\le 3$ star ratings.
  - Implement failover mechanism (WhatsApp $\rightarrow$ Resend Email).
- **Sprint 4.2 (W15):**
  - Implement outgoing Webhook dispatcher with HMAC SHA-256 signature calculation.
  - Build Webhook testing UI in Workspace settings.

---

### Phase 5: AI Insights & Developer SDK (Weeks 16 - 18)
- **Sprint 5.1 (W16-W17):**
  - Integrate Vercel AI SDK with OpenAI `gpt-4o-mini` for feedback sentiment tagging.
  - Build automated weekly feedback summarizer background worker.
  - Implement manager smart response generator component.
- **Sprint 5.2 (W18):**
  - Build TypeScript SDK (`@qrezo/sdk`) package repository.
  - Implement API Key generation & hashing infrastructure (`qrz_live_`).
  - Publish SDK documentation and developer portal guides.

---

### Phase 6: Enterprise Scale & GA Launch (Weeks 19 - 20)
- **Sprint 6.1 (W19):**
  - Deploy Upstash Redis L2 cache and Node LRU L1 cache to `/api/qr/redirect`.
  - Conduct high-concurrency load testing (K6 load script targeting 1,000 RPS).
  - Execute OWASP security vulnerability audit and penetration test.
- **Sprint 6.2 (W20):**
  - Complete v1 to v2 data migration script (moving existing QRs into default Workspaces).
  - General Availability (GA) Public Product Hunt & Press Launch.

---

## 3. Engineering Resource Allocation & Team Composition

| Role | Headcount | Primary Responsibilities |
| :--- | :---: | :--- |
| **Tech Lead / Principal Architect** | 1 | Architecture oversight, DB schemas, security code reviews. |
| **Senior Full-Stack Engineer** | 2 | SmartPage Engine, Block Builder UI, Dashboard development. |
| **Backend / Infrastructure Engineer**| 1 | Redirect engine optimization, Redis caching, Notification router. |
| **Product Designer (UI/UX)** | 1 | Mobile micro-page UX design, Canvas Builder design system. |
| **QA / Automation Engineer** | 1 | End-to-end Playwright tests, load testing with K6. |
