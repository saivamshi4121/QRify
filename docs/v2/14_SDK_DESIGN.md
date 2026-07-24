# 14. Public Developer SDK Design: `@qrezo/sdk`

## 1. Developer Platform Vision & Philosophy

The `@qrezo/sdk` is an official TypeScript/JavaScript client library enabling developers, POS providers (Posist, Toast, Lightspeed), and marketing automation agencies to programmatically integrate Qrezo v2 capabilities directly into third-party software.

### Primary Capabilities
- Programmatically create dynamic QR codes and link them to custom SmartPages.
- Ingest customer feedback responses directly from custom mobile apps or kiosks.
- Retrieve workspace analytics and scan count metrics.
- Verify incoming Qrezo webhook signatures.

---

## 2. SDK Package Installation & Initialization

```bash
npm install @qrezo/sdk
# or
yarn add @qrezo/sdk
```

```typescript
import { QrezoClient } from "@qrezo/sdk";

const qrezo = new QrezoClient({
    apiKey: process.env.QREZO_API_KEY!, // Format: qrz_live_xxxxxxxxxxxx
    environment: "production",          // "production" | "sandbox"
});
```

---

## 3. Core SDK Methods Specification

### 3.1 QR Code Management (`qrezo.qr.*`)

```typescript
// Create a new Dynamic QR code linked to a SmartPage
const newQR = await qrezo.qr.create({
    workspaceId: "ws_88a9123",
    qrName: "Table 14 QR",
    qrType: "smartpage",
    smartPageId: "sp_bella_italia",
    metadata: {
        table: "14",
        zone: "Patio",
    },
    design: {
        foregroundColor: "#1e1b4b",
        backgroundColor: "#ffffff",
        logoUrl: "https://bistro.com/logo.png",
    },
});

console.log(`Created QR Code: ${newQR.shortUrl}`);
console.log(`Cloudinary Image URL: ${newQR.qrImageUrl}`);
```

---

### 3.2 Feedback Querying (`qrezo.feedback.*`)

```typescript
// Query recent negative feedback responses
const negativeFeedback = await qrezo.feedback.list({
    workspaceId: "ws_88a9123",
    maxRating: 3,
    status: "new",
    limit: 10,
});

for (const item of negativeFeedback.data) {
    console.log(`[Table ${item.locationTag}] ${item.ratingScore} Stars: ${item.commentText}`);
}
```

---

### 3.3 Webhook Verification Helper (`qrezo.webhooks.*`)

```typescript
import { QrezoWebhooks } from "@qrezo/sdk";

app.post("/webhooks/qrezo", (req, res) => {
    const signature = req.headers["x-qrezo-signature"] as string;
    const secret = process.env.QREZO_WEBHOOK_SECRET!;

    const isValid = QrezoWebhooks.verifySignature({
        payload: JSON.stringify(req.body),
        signature,
        secret,
    });

    if (!isValid) {
        return res.status(400).send("Invalid Webhook Signature");
    }

    const event = req.body;
    if (event.type === "feedback.submitted") {
        console.log(`Received feedback event: ${event.data.responseId}`);
    }

    res.status(200).send("OK");
});
```

---

## 4. API Key Hashing & Verification Security

Developer API Keys follow the `qrz_live_` / `qrz_test_` prefix standard:
- **Raw Key Format:** `qrz_live_32_random_hex_characters`
- **Database Storage:** Raw API keys are **never stored in plain text**. The database stores an SHA-256 hash of the API key (`models/ApiKey.ts`).
- **Verification:** Incoming Bearer tokens are hashed via SHA-256 and matched against `models/ApiKey.ts`.
