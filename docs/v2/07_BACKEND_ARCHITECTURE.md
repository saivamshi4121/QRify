# 07. Backend Architecture & Service Layer: Qrezo v2

## 1. Clean Layered Architecture Pattern

The Qrezo v2 backend enforces strict separation of concerns through a **3-Tier Layered Architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend Layer Topology                          │
│                                                                        │
│  [ HTTP / Client Request ]                                             │
│         │                                                              │
│         ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Layer 1: HTTP Presentation Layer (/app/api/v2/*)                 │  │
│  │ • Validates request JSON / params with Zod schemas                │  │
│  │ • Extracts Session / API Key identity                            │  │
│  │ • Maps domain exceptions to standard HTTP error codes            │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Layer 2: Core Service Layer (/modules/*/service.ts)              │  │
│  │ • Contains pure business logic, rules, and decision branching     │  │
│  │ • Completely isolated from NextRequest / NextResponse primitives  │  │
│  │ • Triggers domain events via Event Emitter                       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Layer 3: Data Access Layer (/core/repositories/*)                │  │
│  │ • Executes Mongoose queries, aggregations, transactions           │  │
│  │ • Interacts with Redis caching tier                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Standardized Service Method Implementation Pattern

```typescript
// Sample Architectural Implementation: modules/feedback/service.ts

import { FeedbackRepository } from "@/core/repositories/feedbackRepository";
import { NotificationService } from "@/modules/notification/service";
import { eventEmitter } from "@/core/events/eventEmitter";
import { ZFeedbackInput } from "./validation";

export class FeedbackService {
    static async submitFeedback(input: ZFeedbackInput, clientMetadata: { ip: string; userAgent: string }) {
        // 1. Verify existence & active status of target SmartPage
        const page = await FeedbackRepository.findSmartPageById(input.smartPageId);
        if (!page || !page.isPublished) {
            throw new Error("SMARTPAGE_NOT_FOUND");
        }

        // 2. Persist feedback response record
        const feedback = await FeedbackRepository.createFeedbackResponse({
            ...input,
            status: "new",
        });

        // 3. Determine if routing threshold demands negative escalation
        const isNegative = input.ratingScore <= 3;

        // 4. Emit domain event (non-blocking)
        eventEmitter.emit("feedback.submitted", {
            feedbackId: feedback._id.toString(),
            workspaceId: input.workspaceId,
            ratingScore: input.ratingScore,
            isNegative,
        });

        return {
            responseId: feedback._id,
            isNegative,
            actionTaken: isNegative ? "ESC_ALERT_QUEUED" : "NONE",
        };
    }
}
```

---

## 3. Database Transaction Management

For operations requiring multi-document consistency (e.g., creating a new Workspace, auto-generating the default SmartPage, and assigning the User as `owner` in `WorkspaceMember`), Qrezo v2 uses Mongoose Sessions and Mongo ACID Transactions:

```typescript
import dbConnect from "@/config/dbConnect";
import mongoose from "mongoose";

export async function executeInTransaction<T>(work: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
    const conn = await dbConnect();
    const session = await conn.startSession();
    session.startTransaction();
    try {
        const result = await work(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

---

## 4. Centralized Error Handling Architecture

```typescript
// core/errors/AppError.ts

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: any
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad Request", details?: any) {
        super(400, "BAD_REQUEST", message, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, "UNAUTHORIZED", message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(403, "FORBIDDEN", message);
    }
}
```
