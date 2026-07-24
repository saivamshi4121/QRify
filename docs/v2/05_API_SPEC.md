# 05. REST & SDK API Specification: Qrezo v2

## 1. Global API Standards

- **Base URL (Production):** `https://api.qrezo.com/api/v2`
- **Protocol:** HTTPS Only (HTTP requests redirected with 301)
- **Data Format:** Content-Type `application/json`
- **Authentication Header:**
  - **Session Auth (Frontend UI):** Cookie-based NextAuth Session JWT token.
  - **Developer API Key Auth (SDK):** `Authorization: Bearer qrz_live_xxxxxxxxxxxx`

---

## 2. Standardized Response Formats

### Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "requestId": "req_88a9c0112f",
    "timestamp": "2026-07-24T19:15:00.000Z"
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed for feedback submission",
    "details": [
      {
        "field": "ratingScore",
        "message": "ratingScore must be an integer between 1 and 5"
      }
    ]
  },
  "meta": {
    "requestId": "req_88a9c0112f",
    "timestamp": "2026-07-24T19:15:00.000Z"
  }
}
```

---

## 3. Endpoints Breakdown Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              API v2 Endpoints Overview                                 │
├───────────────────┬─────────┬──────────────────────────────────┬───────────────────────┤
│ Group             │ Method  │ Path                             │ Auth Level            │
├───────────────────┼─────────┼──────────────────────────────────┼───────────────────────┤
│ **Workspaces**    │ GET     │ `/api/v2/workspaces`             │ Session (Member)      │
│                   │ POST    │ `/api/v2/workspaces`             │ Session (User)        │
│                   │ PATCH   │ `/api/v2/workspaces/:id`         │ Session (Owner/Admin) │
├───────────────────┼─────────┼──────────────────────────────────┼───────────────────────┤
│ **SmartPages**    │ GET     │ `/api/v2/smartpages`             │ Session (Member)      │
│                   │ POST    │ `/api/v2/smartpages`             │ Session (Admin/Mgr)   │
│                   │ GET     │ `/api/v2/smartpages/:id`         │ Public / Session      │
│                   │ PUT     │ `/api/v2/smartpages/:id/blocks`  │ Session (Admin/Mgr)   │
├───────────────────┼─────────┼──────────────────────────────────┼───────────────────────┤
│ **Feedback**      │ POST    │ `/api/v2/feedback/submit`        │ Public (Rate Limited) │
│                   │ GET     │ `/api/v2/feedback/responses`     │ Session (Member)      │
│                   │ PATCH   │ `/api/v2/feedback/responses/:id` │ Session (Admin/Mgr)   │
├───────────────────┼─────────┼──────────────────────────────────┼───────────────────────┤
│ **Notifications** │ GET     │ `/api/v2/notifications/rules`    │ Session (Admin)       │
│                   │ POST    │ `/api/v2/notifications/rules`    │ Session (Admin)       │
├───────────────────┼─────────┼──────────────────────────────────┼───────────────────────┤
│ **Public Analytics│ GET     │ `/api/v2/analytics/overview`     │ Session (Member)      │
└───────────────────┴─────────┴──────────────────────────────────┴───────────────────────┘
```

---

## 4. Key API Specifications Detail

### 4.1 Post Feedback Submission Endpoint

- **Endpoint:** `POST /api/v2/feedback/submit`
- **Access:** Public (Protected by IP Rate-Limiting Engine: 5 requests / 10 mins per IP)
- **Purpose:** Ingests user star rating and private review feedback. Evaluates routing rules.

#### Request Body
```json
{
  "qrCodeId": "66a1e948c27e8a00129a4411",
  "smartPageId": "66a1e950c27e8a00129a4412",
  "ratingScore": 2,
  "category": "service",
  "commentText": "Food was cold and waiter took 30 minutes to take order.",
  "customerName": "John Doe",
  "customerPhone": "+14155552671",
  "locationTag": "Table 14"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "responseId": "66a1ef88c27e8a00129a9999",
    "actionTaken": "INTERNAL_ALERT_TRIGGERED",
    "routingResult": {
      "isNegative": true,
      "alertDispatched": true,
      "redirectUrl": null
    }
  }
}
```

---

### 4.2 Update SmartPage Blocks Endpoint

- **Endpoint:** `PUT /api/v2/smartpages/:id/blocks`
- **Access:** Session Required (Role: `owner`, `admin`, `manager`)
- **Purpose:** Re-orders, configures, or adds blocks on a SmartPage micro-landing.

#### Request Body
```json
{
  "blocks": [
    {
      "blockType": "header",
      "sortOrder": 0,
      "title": "Welcome to Bella Italia",
      "config": {
        "subtitle": "Please rate your experience with us today",
        "logoUrl": "https://res.cloudinary.com/qrezo/image/upload/v1/logo.png"
      },
      "isVisible": true
    },
    {
      "blockType": "rating",
      "sortOrder": 1,
      "title": "Overall Experience",
      "config": {
        "starStyle": "modern_gold",
        "thresholdRedirectUrl": "https://search.google.com/local/writereview?placeid=ChIJN1t_tDe1RIwR",
        "negativeThreshold": 3
      },
      "isVisible": true
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "smartPageId": "66a1e950c27e8a00129a4412",
    "updatedBlocksCount": 2,
    "updatedAt": "2026-07-24T19:20:00.000Z"
  }
}
```

---

## 5. HTTP Error Code Standards

| HTTP Code | Error Code Constant | Scenario |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Request payload fails Zod schema validation. |
| `401 Unauthorized` | `AUTH_REQUIRED` | Missing or expired session cookie / API Bearer token. |
| `403 Forbidden` | `INSUFFICIENT_PERMISSIONS` | User role lacks permission for target Workspace. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Requested QR code, SmartPage, or response ID does not exist. |
| `429 Too Many Requests`| `RATE_LIMIT_EXCEEDED` | Request volume breached rate limit threshold. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Uncaught application error (logged to error tracker). |
