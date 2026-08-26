# QR & Smart Page Entitlements Architecture

**Target File:** `docs/architecture/qr-reviewpage-entitlements.md`  
**Date:** August 12, 2026  
**Milestone:** Milestone 3 - QR + Review Page Entitlements  
**Status:** Implemented & Verified  

---

## 1. QR Quota & Usage Definition

### Rule:
> **QR Code Usage** is defined as the total number of **active** QR codes belonging to a workspace:  
> `QRCode.countDocuments({ workspaceId, isActive: true })`

### Details:
- Soft-deleted or deactivated QR codes (`isActive: false`) do NOT count against active plan quotas.
- Count queries are executed strictly within the active workspace context (`workspaceId`).
- Plan limits are centrally configured in `config/plans.config.ts` (`Free = 3`, `Pro = 100`, `Business = 1000`).

---

## 2. Smart Page / Review Page Quota & Usage Definition

### Rule:
> **Smart Page Usage** is defined as the total number of Smart Pages belonging to a workspace:  
> `SmartPage.countDocuments({ workspaceId })`

### Details:
- Hard-deleted Smart Pages (`deleteSmartPage()`) decrement usage immediately upon deletion.
- Published and draft Smart Pages both count toward the quota because storage and page configurations are allocated.
- Plan limits are centrally configured in `config/plans.config.ts` (`Free = 1`, `Pro = 25`, `Business = 200`).

---

## 3. Workspace Scoping & Plan Source of Truth

Entitlements are calculated strictly per workspace:
- **Source of Truth:** `Workspace.planTier` (retrieved via `getWorkspacePlan(workspaceId)`).
- **Workspace Isolation:** Workspace A reaching its QR code limit does NOT affect Workspace B's independent quota, even if both workspaces belong to the same owner account.
- **Runtime Independence:** A user account with `User.subscriptionPlan = "business"` that switches to a `Free` workspace will be strictly governed by the `Free` tier limits of that workspace.

---

## 4. Creation Enforcement Architecture

Resource creation paths enforce limits BEFORE persisting new entities:

```
           Client Request (POST /api/qr/generate or POST /api/v2/smartpages)
                                        │
                                        ▼
                           resolveWorkspaceContext()
                                        │
                                        ▼
                  EntitlementService.assertWithinLimit(workspaceId, resource)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
            [Usage < Limit]                         [Usage >= Limit]
                    │                                       │
                    ▼                                       ▼
            Proceed to Create                       Throw PlanLimitReachedError
           (Save to Database)                       (Returns HTTP 403 JSON Error)
```

### Enforced Locations:
1. **QR Code Generation:** `POST /api/qr/generate` -> `assertWithinLimit(workspaceId, "qr_codes")`.
2. **Smart Page Creation:** `createSmartPage()` in `modules/smartpage/service.ts` -> `assertWithinLimit(workspaceId, "smart_pages")`.
3. **Smart Page Duplication:** `duplicateSmartPage()` in `modules/smartpage/service.ts` -> `assertWithinLimit(workspaceId, "smart_pages")`.

---

## 5. Downgrade Behavior

When a workspace is downgraded (e.g., from `Pro` to `Free`):
- **Resource Retention:** Existing resources created while on a higher plan tier are **NEVER** automatically deleted or destroyed.
- **Read & Management Access:** Users retain full read, edit, and management permissions over existing resources.
- **Creation Block:** New resource creation is blocked until active usage drops below the new plan tier limit.

---

## 6. Error Behavior & Response Format

When a limit is reached, `assertWithinLimit` throws `PlanLimitReachedError`.  
`handleApiError()` captures this error and returns a clean, structured JSON response without exposing internal MongoDB details:

```json
{
  "success": false,
  "message": "Limit reached for 'qr_codes' (3/3) on the Free plan. Upgrade to increase your limit.",
  "code": "plan_limit_reached",
  "details": {
    "resource": "qr_codes",
    "currentUsage": 3,
    "limit": 3,
    "currentPlan": "free"
  }
}
```

- **HTTP Status Code:** `403 Forbidden`
- **Error Code:** `plan_limit_reached`

---

## 7. MongoDB Indexes Added

To support high-throughput count queries executed by `getUsage()`, the following compound index was added:

| Collection | Compound Index | Query Supported | Rationale |
| :--- | :--- | :--- | :--- |
| `qrcodes` | `{ workspaceId: 1, isActive: 1 }` | `QRCode.countDocuments({ workspaceId, isActive: true })` | Avoids collection scans by filtering workspace active QR counts directly in B-tree index nodes. |

---

## 8. Legacy `subscriptionGuard` Migration

- The legacy `lib/guards/subscriptionGuard.ts` has been refactored to delegate directly to `EntitlementService.assertWithinLimit(workspaceId, "qr_codes")`.
- `POST /api/qr/generate` was updated to import and execute `assertWithinLimit(workspaceId, "qr_codes")` natively.
