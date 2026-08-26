# Event, Attendee, and Scanner Entitlements Architecture

**Target File:** `docs/architecture/event-attendee-scanner-entitlements.md`  
**Date:** August 12, 2026  
**Milestone:** Milestone 4 - Event + Attendee + Scanner Entitlements  
**Status:** Implemented & Verified  

---

## 1. Event Quota & Usage Definition

### Rule:
> **Event Usage** is defined as the total number of **active/non-archived** events in a workspace:  
> `Event.countDocuments({ workspaceId, status: { $ne: "archived" } })`

### Details:
- Draft, Published, and Completed events count toward the workspace event quota.
- Archived (`status: "archived"`) or deleted events do NOT count toward the active event limit.
- Central plan limits (`config/plans.config.ts`):  
  - **Free:** 1 Event  
  - **Pro:** 5 Events  
  - **Business:** 50 Events  

---

## 2. Attendee Quota & Usage Definition

### Rule:
> **Attendee Usage** is defined as the total number of registered attendees **per event** within a workspace:  
> `Attendee.countDocuments({ workspaceId, eventId })`

### Details:
- Quota is scoped **per event** (not global across the workspace).
- Hard-deleted attendees immediately free up event capacity.
- Updating an existing attendee (PATCH/PUT) does NOT consume quota.
- Central plan limits (`config/plans.config.ts`):  
  - **Free:** 50 Attendees / event  
  - **Pro:** 500 Attendees / event  
  - **Business:** 10,000 Attendees / event  

---

## 3. Bulk CSV Import Pre-Validation Behavior

To prevent partial CSV imports (e.g. limit is 50, current usage is 45, CSV has 20 rows, importing 5 then failing midway):
1. The import service parses and validates CSV rows via `bulkImportPreview`.
2. It calculates the count of **genuinely new, non-duplicate** rows (`validNewRows`).
3. It pre-validates: `currentUsage + validNewRows.length <= limit`.
4. If `currentUsage + validNewRows.length > limit`, it throws `PlanLimitReachedError` **BEFORE creating any attendee record in the database**.
5. Duplicate rows in the CSV or emails already registered for the event are filtered out during preview and do not count toward `validNewRows`.

---

## 4. Scanner Device Quota & Usage Definition

### Rule:
> **Scanner Device Usage** is defined as the total active/pairing scanner devices for an event/workspace:  
> `ScannerDevice.countDocuments({ workspaceId, eventId, status: { $ne: "disabled" } })`

### Details:
- Active online scanners and pending pairing codes (`status: "PAIRING"`) count against the scanner device limit.
- Revoking/unpairing a device (`status: "DISABLED"`) frees up scanner capacity immediately.
- Revoking a scanner retains access logs, scan history, and operator audit trail without deleting device history.
- Central plan limits (`config/plans.config.ts`):  
  - **Free:** 1 Scanner Device  
  - **Pro:** 3 Scanner Devices  
  - **Business:** 20 Scanner Devices  

---

## 5. Server-Side Enforcement Locations

All entitlement checks occur in the core service layer before any database record creation:

| Resource | Enforcement Location | Service Function | Method Called |
| :--- | :--- | :--- | :--- |
| **Event** | `modules/event/service.ts` | `createEvent()` | `assertWithinLimit(workspaceId, "events")` |
| **Attendee** | `modules/attendee/service.ts` | `createAttendee()` | `assertWithinLimit(workspaceId, "attendees", { eventId })` |
| **Attendee Bulk** | `modules/attendee/service.ts` | `bulkImport()` | Pre-check `currentUsage + newCount <= limit` |
| **Scanner Pairing** | `modules/scanner-device/service.ts` | `createPairing()` | `assertWithinLimit(workspaceId, "scanner_devices", { eventId })` |
| **Staff Scanner** | `modules/scanner-device/service.ts` | `createStaffSession()` | `assertWithinLimit(workspaceId, "scanner_devices", { eventId })` |

---

## 6. Workspace Scoping & Plan Source of Truth

- **Source of Truth:** `Workspace.planTier` (retrieved via `getWorkspacePlan(workspaceId)`).
- **Workspace Isolation:** Usage is strictly partitioned by `workspaceId`. A user operating in Workspace A (Free) and Workspace B (Business) experiences isolated plan limits per workspace.
- **Legacy User Profile Decoupling:** `User.subscriptionPlan` is never used for runtime entitlement decisions.

---

## 7. Downgrade Behavior

When a workspace plan is downgraded (e.g., Pro -> Free):
- Existing Events, Attendees, and Scanner Devices are **NEVER** deleted or modified automatically.
- Users retain full view, export, and management access for all existing resources.
- Creating **new** Events, Attendees, or Scanner Devices is blocked if current usage exceeds or equals the new plan tier limit.

---

## 8. Error Response Format

When a limit is reached, `assertWithinLimit()` throws `PlanLimitReachedError`. `handleApiError()` returns:

```json
{
  "success": false,
  "message": "Limit reached for 'events' (1/1) on the Free plan. Upgrade to increase your limit.",
  "code": "plan_limit_reached",
  "details": {
    "resource": "events",
    "currentUsage": 1,
    "limit": 1,
    "currentPlan": "free"
  }
}
```

- **HTTP Status Code:** `403 Forbidden`
- **Error Code:** `plan_limit_reached`

---

## 9. MongoDB Indexes

The following indexes optimize entitlement count queries:

| Collection | Compound Index | Query Supported | Rationale |
| :--- | :--- | :--- | :--- |
| `events` | `{ workspaceId: 1, status: 1 }` | `Event.countDocuments({ workspaceId, status: { $ne: "archived" } })` | Speeds up workspace active event count queries. |
| `attendees` | `{ workspaceId: 1, eventId: 1, registrationStatus: 1 }` | `Attendee.countDocuments({ workspaceId, eventId })` | Speeds up per-event attendee count queries. |
| `scannerdevices` | `{ workspaceId: 1, status: 1 }` | `ScannerDevice.countDocuments({ workspaceId, status: { $ne: "disabled" } })` | Speeds up active scanner device count queries per workspace. |
