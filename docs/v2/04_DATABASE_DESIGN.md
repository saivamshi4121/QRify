# 04. Database Design & Schemas: Qrezo v2

## 1. Entity-Relationship Diagram (v2 Schema Topology)

```mermaid
erDiagram
    USER ||--o{ WORKSPACE_MEMBER : belongs_to
    WORKSPACE ||--o{ WORKSPACE_MEMBER : contains
    WORKSPACE ||--o{ QRCODE : owns
    WORKSPACE ||--o{ SMARTPAGE : owns
    WORKSPACE ||--o{ NOTIFICATION_RULE : configures
    WORKSPACE ||--o{ FEEDBACK_RESPONSE : receives
    
    SMARTPAGE ||--o{ BLOCK : contains
    QRCODE ||--o| SMARTPAGE : targets
    QRCODE ||--o{ SCANLOG : tracks
    FEEDBACK_RESPONSE }|--|| QRCODE : triggered_by
    FEEDBACK_RESPONSE }|--|| SMARTPAGE : generated_on

    USER {
        ObjectId _id PK
        string email UK
        string passwordHash
        string fullName
        string globalRole "superadmin | user"
        date createdAt
    }

    WORKSPACE {
        ObjectId _id PK
        string name
        string slug UK
        ObjectId ownerId FK
        string planTier "free | pro | business | enterprise"
        date createdAt
    }

    WORKSPACE_MEMBER {
        ObjectId _id PK
        ObjectId workspaceId FK
        ObjectId userId FK
        string role "owner | admin | manager | staff | viewer"
        date joinedAt
    }

    QRCODE {
        ObjectId _id PK
        ObjectId workspaceId FK
        string shortUrl UK, IX
        string targetType "url | smartpage"
        string destinationUrl
        ObjectId smartPageId FK
        number scanCount IX
        boolean isActive
    }

    SMARTPAGE {
        ObjectId _id PK
        ObjectId workspaceId FK
        string title
        string slug UK
        string themeConfig
        boolean isPublished
    }

    BLOCK {
        ObjectId _id PK
        ObjectId smartPageId FK
        string blockType "rating | feedback | google_review | offer | text"
        number sortOrder
        object config
    }

    FEEDBACK_RESPONSE {
        ObjectId _id PK
        ObjectId workspaceId FK
        ObjectId qrCodeId FK
        ObjectId smartPageId FK
        number ratingScore IX
        string category
        string commentText
        string customerPhone
        string locationTag
        string status "new | acknowledged | resolved"
        date createdAt IX
    }

    NOTIFICATION_RULE {
        ObjectId _id PK
        ObjectId workspaceId FK
        string channel "whatsapp | email | webhook"
        number triggerMinRating
        number triggerMaxRating
        string recipientTarget
        boolean isActive
    }
```

---

## 2. Comprehensive TypeScript Mongoose Schemas

### 2.1 Workspace Model (`models/Workspace.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspace extends Document {
    name: string;
    slug: string;
    ownerId: mongoose.Types.ObjectId;
    planTier: "free" | "pro" | "business" | "enterprise";
    settings: {
        defaultLanguage: string;
        timeZone: string;
        customDomain?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, index: true },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        planTier: { 
            type: String, 
            enum: ["free", "pro", "business", "enterprise"], 
            default: "free" 
        },
        settings: {
            defaultLanguage: { type: String, default: "en" },
            timeZone: { type: String, default: "UTC" },
            customDomain: { type: String, sparse: true, unique: true },
        },
    },
    { timestamps: true }
);

export default mongoose.models.Workspace || mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
```

---

### 2.2 Workspace Member Model (`models/WorkspaceMember.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspaceMember extends Document {
    workspaceId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: "owner" | "admin" | "manager" | "staff" | "viewer";
    assignedLocations?: string[];
    createdAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        role: { 
            type: String, 
            enum: ["owner", "admin", "manager", "staff", "viewer"], 
            required: true 
        },
        assignedLocations: [{ type: String }],
    },
    { timestamps: true }
);

// Compound index enforcing unique membership per workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.models.WorkspaceMember || mongoose.model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema);
```

---

### 2.3 SmartPage & Block Models (`models/SmartPage.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IBlock {
    _id?: mongoose.Types.ObjectId;
    blockType: "rating" | "feedback_form" | "google_review" | "offer_code" | "social_links" | "video" | "header";
    sortOrder: number;
    title?: string;
    config: Record<string, any>; // Dynamic configuration block attributes
    isVisible: boolean;
}

export interface ISmartPage extends Document {
    workspaceId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    theme: {
        primaryColor: string;
        backgroundColor: string;
        fontFamily: string;
        logoUrl?: string;
    };
    blocks: IBlock[];
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>({
    blockType: { 
        type: String, 
        enum: ["rating", "feedback_form", "google_review", "offer_code", "social_links", "video", "header"],
        required: true 
    },
    sortOrder: { type: Number, required: true, default: 0 },
    title: { type: String },
    config: { type: Schema.Types.Mixed, default: {} },
    isVisible: { type: Boolean, default: true },
});

const SmartPageSchema = new Schema<ISmartPage>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        theme: {
            primaryColor: { type: String, default: "#6366f1" },
            backgroundColor: { type: String, default: "#f8fafc" },
            fontFamily: { type: String, default: "Inter" },
            logoUrl: { type: String },
        },
        blocks: [BlockSchema],
        isPublished: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.SmartPage || mongoose.model<ISmartPage>("SmartPage", SmartPageSchema);
```

---

### 2.4 Feedback Response Model (`models/FeedbackResponse.ts`)
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IFeedbackResponse extends Document {
    workspaceId: mongoose.Types.ObjectId;
    qrCodeId: mongoose.Types.ObjectId;
    smartPageId: mongoose.Types.ObjectId;
    ratingScore: number; // 1 to 5
    category?: "food" | "service" | "ambience" | "cleanliness" | "value" | "other";
    commentText?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    locationTag?: string; // Table number or branch location
    status: "new" | "acknowledged" | "resolved";
    resolutionNotes?: string;
    resolvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FeedbackResponseSchema = new Schema<IFeedbackResponse>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
        qrCodeId: { type: Schema.Types.ObjectId, ref: "QRCode", required: true, index: true },
        smartPageId: { type: Schema.Types.ObjectId, ref: "SmartPage", required: true, index: true },
        ratingScore: { type: Number, required: true, min: 1, max: 5, index: true },
        category: { type: String, enum: ["food", "service", "ambience", "cleanliness", "value", "other"] },
        commentText: { type: String, trim: true, maxlength: 2000 },
        customerName: { type: String, trim: true },
        customerPhone: { type: String, trim: true },
        customerEmail: { type: String, lowercase: true, trim: true },
        locationTag: { type: String, trim: true, index: true },
        status: { 
            type: String, 
            enum: ["new", "acknowledged", "resolved"], 
            default: "new",
            index: true 
        },
        resolutionNotes: { type: String },
        resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Compound indexes for analytical queries
FeedbackResponseSchema.index({ workspaceId: 1, createdAt: -1 });
FeedbackResponseSchema.index({ workspaceId: 1, ratingScore: 1, status: 1 });

export default mongoose.models.FeedbackResponse || mongoose.model<IFeedbackResponse>("FeedbackResponse", FeedbackResponseSchema);
```

---

## 3. Database Indexing Strategy & Performance Tuning

| Collection | Index Keys | Index Type | Business Rationale |
| :--- | :--- | :--- | :--- |
| **`qrcodes`** | `{ shortUrl: 1 }` | Unique B-Tree | High-speed redirect lookup ($< 2\text{ms}$). |
| **`workspacemembers`** | `{ workspaceId: 1, userId: 1 }` | Unique Compound | Fast authorization role verification. |
| **`feedbackresponses`** | `{ workspaceId: 1, createdAt: -1 }` | Compound | Fast timeline query for dashboard feeds. |
| **`feedbackresponses`** | `{ workspaceId: 1, ratingScore: 1 }` | Compound | Filter low-rating incidents for manager alerts. |
| **`scanlogs`** | `{ qrCodeId: 1, scannedAt: -1 }` | Compound | Analytics time-series aggregation queries. |
