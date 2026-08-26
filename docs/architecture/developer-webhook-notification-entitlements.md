# Developer API, Webhook, and Notification Entitlements Architecture

**Target File:** `docs/architecture/developer-webhook-notification-entitlements.md`  
**Date:** August 12, 2026  
**Milestone:** Milestone 5 - Developer API + Webhook + Notification Entitlements  
**Status:** Implemented & Verified  

---

## 1. Feature Gates & Quota Definitions

### A. API Keys / Developer API
- **Feature Gate:** `api_access` (`assertFeature(workspaceId, "api_access")`).
- **Quota Usage:** Total active/non-revoked API keys in a workspace:  
  `ApiKey.countDocuments({ workspaceId, revokedAt: null })`
- **Plan Configuration (`config/plans.config.ts`):**
  - **Free:** `api_access: false`, `api_keys: 0`
  - **Pro:** `api_access: true`, `api_keys: 2`
  - **Business:** `api_access: true`, `api_keys: 10`

### B. Webhook Endpoints
- **Feature Gate:** `webhooks` (`assertFeature(workspaceId, "webhooks")`).
- **Quota Usage:** Total active webhook endpoints in a workspace:  
  `WebhookEndpoint.countDocuments({ workspaceId, enabled: true })`
- **Plan Configuration (`config/plans.config.ts`):**
  - **Free:** `webhooks: false`, `webhook_endpoints: 0`
  - **Pro:** `webhooks: true`, `webhook_endpoints: 2`
  - **Business:** `webhooks: true`, `webhook_endpoints: 10`

### C. Notification Templates
- **Feature Gate:** `notifications` (`assertFeature(workspaceId, "notifications")`).
- **Quota Usage:** Total notification templates in a workspace:  
  `NotificationTemplate.countDocuments({ workspaceId })`
- **Plan Configuration (`config/plans.config.ts`):**
  - **Free:** `notifications: false`, `notification_templates: 1`
  - **Pro:** `notifications: true`, `notification_templates: 5`
  - **Business:** `notifications: true`, `notification_templates: 25`

---

## 2. Server-Side Enforcement Locations

Entitlement checks are strictly enforced in the service boundary before resource allocation:

| Domain | Service File | Function | Feature Check | Quota Check | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Keys** | `modules/api-key/service.ts` | `createApiKey()` | `assertFeature(..., "api_access")` | `assertWithinLimit(..., "api_keys")` | Skipped for key rotation (`rotateApiKey`). |
| **Webhooks** | `modules/webhooks/endpointService.ts` | `createWebhookEndpoint()` | `assertFeature(..., "webhooks")` | `assertWithinLimit(..., "webhook_endpoints")` | Enforced at creation time. |
| **Notifications** | `modules/notifications/templateService.ts` | `createNotificationTemplate()` | `assertFeature(..., "notifications")` | `assertWithinLimit(..., "notification_templates")` | Skipped during initial starter template seeding. |

---

## 3. Public API Request & Key Lifecycle Behavior

1. **Key Creation Boundary:** Entitlement checks (`api_access` feature gate + `api_keys` quota) occur **only** during API key creation.
2. **Public API Requests:** Standard API key authentication (`withApiKey` middleware) validates signature format, hash lookup, expiration, and scope permissions. To prevent performance degradation, database entitlement lookups are **not** performed on every public API request.
3. **Key Rotation & Management:** Renaming, revoking, rotating, or viewing existing API keys remains accessible to workspace members regardless of plan status.

---

## 4. Downgrade Behavior

When a workspace is downgraded (e.g. Business -> Free):
- Existing API keys, Webhook endpoints, and Notification templates are **never deleted or destroyed**.
- Existing enabled webhooks continue to process domain events and retry deliveries.
- Existing valid API keys remain operational for public API calls.
- Creating **new** API keys, Webhooks, or Notification templates is blocked until the workspace upgrades or usage falls below the plan limit.

---

## 5. Error Behavior & Responses

Entitlement violations return HTTP 403 Forbidden with structured JSON error payloads:

### Feature Gate Violation (`FeatureNotAvailableError`)
```json
{
  "success": false,
  "message": "Feature 'api_access' is not available on the Free plan. Upgrade to access this feature.",
  "code": "feature_not_available",
  "details": {
    "feature": "api_access",
    "currentPlan": "free"
  }
}
```

### Quota Exceeded Violation (`PlanLimitReachedError`)
```json
{
  "success": false,
  "message": "Limit reached for 'api_keys' (2/2) on the Pro plan. Upgrade to increase your limit.",
  "code": "plan_limit_reached",
  "details": {
    "resource": "api_keys",
    "currentUsage": 2,
    "limit": 2,
    "currentPlan": "pro"
  }
}
```

---

## 6. MongoDB Index Audit

| Collection | Index | Query Supported | Rationale |
| :--- | :--- | :--- | :--- |
| `apikeys` | `{ workspaceId: 1, revokedAt: 1 }` | `ApiKey.countDocuments({ workspaceId, revokedAt: null })` | Optimizes count of active API keys per workspace. |
| `webhookendpoints` | `{ workspaceId: 1, enabled: 1 }` | `WebhookEndpoint.countDocuments({ workspaceId, enabled: true })` | Optimizes count of enabled webhooks per workspace. |
| `notificationtemplates` | `{ workspaceId: 1 }` | `NotificationTemplate.countDocuments({ workspaceId })` | Optimizes count of notification templates per workspace. |
