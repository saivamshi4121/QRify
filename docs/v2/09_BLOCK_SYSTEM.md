# 09. Block System Specification: Qrezo v2

## 1. Modular Block System Overview

In Qrezo v2, micro-landing pages are built dynamically by composining self-contained units called **Blocks**. Each Block manages its own UI representation, dynamic configuration schema, state management, and data collection behavior.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SmartPage Block Hierarchy                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Block 0: Header Block (Logo, Restaurant Name, Table Indicator)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Block 1: 5-Star Rating Block (Interactive Star Rating Bar)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Block 2: Conditional Feedback Form Block (Appears on <= 3 Stars) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Block 3: Offer Code Voucher Block ("10% off your next visit")    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Block 4: Social Links & Wi-Fi Connect Block                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Block Types Catalogue

| Block Type ID | Display Name | Purpose | Primary Data Collected | Configurable Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `header` | Hero Header | Displays brand logo, business title, and table/location tag. | None | `logoUrl`, `title`, `subtitle`, `headerStyle` |
| `rating` | Star Rating | Captures initial 1-5 star customer score. | `ratingScore` | `starCount` (5), `negativeThreshold` (3), `accentColor` |
| `feedback_form` | Private Feedback Form | Captures detailed text feedback, category tags, customer name & phone. | `commentText`, `category`, `phone`, `email` | `categories[]`, `requirePhone` (boolean), `placeholder` |
| `google_review` | Google Review Booster| Directs satisfied users to Google Maps review page. | Click Event | `googlePlaceId`, `customReviewUrl`, `buttonText` |
| `offer_code` | Promo Voucher | Displays discount code or claimable digital coupon upon submission. | Claim Event | `discountCode`, `termsText`, `expiryDate`, `bgPattern` |
| `social_links` | Social Links | Renders Instagram, Facebook, TripAdvisor, and WhatsApp connect buttons. | Click Analytics | `instagramUrl`, `whatsappNumber`, `tripadvisorUrl` |
| `video` | Video Player | Embeds YouTube or Vimeo promotional video or chef introduction. | Watch Analytics | `videoUrl`, `autoPlay` (boolean), `aspectRatio` |
| `menu_catalog` | Digital Menu | Displays categorised food items with pricing, badges, and photos. | Item Click | `categories[]`, `currencySymbol`, `pdfDownloadUrl` |

---

## 3. TypeScript Block Interface Contract

Every block definition inside Qrezo v2 must implement the unified `IBlockDefinition` interface:

```typescript
export type BlockType = 
    | "header" 
    | "rating" 
    | "feedback_form" 
    | "google_review" 
    | "offer_code" 
    | "social_links" 
    | "video" 
    | "menu_catalog";

export interface IBlockData {
    id: string;
    type: BlockType;
    sortOrder: number;
    isVisible: boolean;
    config: Record<string, any>;
}

export interface IBlockComponentProps<T = Record<string, any>> {
    blockId: string;
    config: T;
    context: {
        workspaceId: string;
        smartPageId: string;
        qrCodeId: string;
        locationTag?: string;
    };
    onStateChange?: (payload: any) => void;
}
```

---

## 4. Specific Block Configuration Specifications

### 4.1 Rating Block Configuration Schema (`rating`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "questionPrompt": { "type": "string", "default": "How was your experience today?" },
    "starStyle": { "type": "string", "enum": ["gold", "minimal_black", "emoji"], "default": "gold" },
    "negativeThreshold": { "type": "integer", "minimum": 1, "maximum": 4, "default": 3 },
    "positiveRedirectUrl": { "type": "string", "format": "uri" },
    "positiveActionType": { "type": "string", "enum": ["redirect_google", "show_offer", "show_thankyou"], "default": "redirect_google" }
  },
  "required": ["questionPrompt", "negativeThreshold"]
}
```

---

### 4.2 Feedback Form Block Configuration Schema (`feedback_form`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "formTitle": { "type": "string", "default": "We'd love to make things right" },
    "formSubtitle": { "type": "string", "default": "Please share what went wrong with your visit" },
    "categories": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["Food Quality", "Service Speed", "Cleanliness", "Staff Behavior", "Other"]
    },
    "collectName": { "type": "boolean", "default": true },
    "collectPhone": { "type": "boolean", "default": true },
    "requirePhone": { "type": "boolean", "default": false },
    "submitButtonText": { "type": "string", "default": "Send Private Feedback" }
  }
}
```

---

## 5. Block System Extensibility Architecture

To create a new Block (e.g., `survey_quiz`), a developer simply registers a new renderer in the **Block Registry**:

```typescript
// components/blocks/BlockRegistry.ts

import { HeaderBlock } from "./HeaderBlock";
import { RatingBlock } from "./RatingBlock";
import { FeedbackFormBlock } from "./FeedbackFormBlock";
import { GoogleReviewBlock } from "./GoogleReviewBlock";

export const BLOCK_REGISTRY: Record<string, React.ComponentType<IBlockComponentProps<any>>> = {
    header: HeaderBlock,
    rating: RatingBlock,
    feedback_form: FeedbackFormBlock,
    google_review: GoogleReviewBlock,
};
```
