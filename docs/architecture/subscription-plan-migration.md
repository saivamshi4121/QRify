# Subscription & Workspace Plan Migration Architecture

**Target File:** `docs/architecture/subscription-plan-migration.md`  
**Date:** August 12, 2026  
**Milestone:** Milestone 2 - Workspace Plan Migration  
**Status:** Completed Baseline Blueprint  

---

## 1. Why `Workspace.planTier` is Authoritative

Qrezo is a multi-tenant SaaS application where domain resources (QR Codes, Smart Pages, Events, Attendees, Scanner Devices, API Keys, Webhooks, Notifications) belong to a **Workspace**, not directly to an individual User account.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTHORITATIVE PLAN MODEL                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Workspace.planTier = SINGLE SOURCE OF TRUTH FOR ALL ENTITLEMENT DECISIONS    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Benefits:
1. **Multi-Tenancy Isolation:** Different workspaces owned by or joined by the same user can operate on different plan tiers independently.
2. **Team Collaboration:** All team members operating within a workspace share the workspace's entitlement quotas and feature access, regardless of their personal account status.
3. **Decoupled Billing:** Payment providers (Razorpay, Stripe) update the specific target workspace tier without interfering with other workspaces.

---

## 2. Why `User.subscriptionPlan` Remains Temporarily

`User.subscriptionPlan` was the original, legacy single-tenant field used prior to the workspace architecture.

It is retained temporarily for the following reasons:
1. **Backward Compatibility:** Legacy UI display badges, session tokens (NextAuth JWT), and scripts expect `User.subscriptionPlan` during the phased transition.
2. **Initial Backfill Seed:** Used as a fallback seed during initial workspace migration for users whose workspaces have not yet been assigned explicit plans.
3. **Phased Deprecation:** Avoids breaking existing payment order creation or legacy admin dashboard workflows while entitlement enforcement is being migrated to `Workspace.planTier`.

---

## 3. Migration Rules & Backfill Engine

The backfill utility (`modules/workspace/migration.ts`) ensures safe, non-destructive, and idempotent initialization of `Workspace.planTier`.

```
                        ┌──────────────────────────────────┐
                        │      Inspect Workspace Record    │
                        └──────────────────────────────────┘
                                          │
                                          ▼
                         /────────────────────────────────\
                        <  Workspace.planTier is valid?   >
                         \────────────────────────────────/
                                /                  \
                          Yes  /                    \ No / Missing / Invalid
                              ▼                      ▼
                    ┌──────────────────┐   ┌────────────────────────────────┐
                    │ Preserve Existing│   │ Read Owner.subscriptionPlan   │
                    │ Plan (Unchanged) │   │ (Fallback to "free" if invalid)│
                    └──────────────────┘   └────────────────────────────────┘
                                                     │
                                                     ▼
                                           ┌──────────────────┐
                                           │ Set planTier and │
                                           │ Save Workspace   │
                                           └──────────────────┘
```

### Key Migration Invariants:
- **Idempotent Execution:** Running the migration script multiple times produces identical DB states. Valid plans are never re-evaluated or overwritten.
- **Non-Destructive:** Existing valid plans (e.g., custom enterprise grants or custom pro tiers) are never overwritten or downgraded.

---

## 4. Multiple Workspace Behavior

A single user account can own or belong to multiple workspaces with distinct plans:

```
                          ┌──────────────────────────┐
                          │    User Account (Alice)  │
                          └──────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│ Workspace A (Personal) │    │ Workspace B (Event Co) │    │ Workspace C (Agency)   │
│ planTier: "free"       │    │ planTier: "pro"        │    │ planTier: "business"   │
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

- Entitlements are resolved **dynamically from the active workspace context** (`resolveWorkspace()` / `getWorkspacePlan(workspaceId)`).
- Changing `User.subscriptionPlan` or upgrading Workspace B does **NOT** alter the plan tiers of Workspace A or Workspace C.

---

## 5. New Workspace Default

- **Secondary Workspaces:** Created via `POST /api/v2/workspaces` automatically receive `planTier: "free"`. Clients cannot arbitrarily pass `planTier` in the payload.
- **Initial Default Workspace:** Created via `ensureDefaultWorkspace(userId)` initializes `planTier` from `user.subscriptionPlan || "free"`.

---

## 6. Invalid Plan Handling

Supported plan tiers are strictly defined in `modules/entitlement/constants.ts`:
- `"free"`
- `"pro"`
- `"business"`
- `"enterprise"`

If a record in the database contains an invalid string (e.g., `"gold"`, `null`, `""`), `getWorkspacePlan()` and `migrateWorkspacePlans()` safely handle it by falling back to `"free"` without throwing uncaught exceptions or breaking application execution.

---

## 7. Categorization of `User.subscriptionPlan` Usages

| Usage Category | Location | Action / Status |
| :--- | :--- | :--- |
| **Entitlement Logic** | `lib/guards/subscriptionGuard.ts` | Scheduled for deprecation/replacement in Milestone 4. |
| **Payment Logic** | `app/api/payments/razorpay/webhook/route.ts` | Updated to sync both `User.subscriptionPlan` AND `Workspace.planTier`. |
| **Admin Management** | `app/api/admin/users/route.ts` | Updated to sync both `User.subscriptionPlan` AND `Workspace.planTier`. |
| **Session / JWT** | `lib/auth.ts`, `types/next-auth.d.ts` | Retained for UI display badges. |
| **UI Displays** | `app/(dashboard)\\_components\\DashboardChrome.tsx`, `settings/page.tsx` | Retained for account level display. |

---

## 8. Future Removal Plan

Once all endpoint guards are fully migrated to `EntitlementService.assertWithinLimit()` and `EntitlementService.assertFeature()`, `User.subscriptionPlan` will be formally marked `@deprecated` in the schema and eventually pruned.
