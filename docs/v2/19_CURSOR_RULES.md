# 19. Cursor Rules & AI Guidelines: Qrezo v2

## 1. Core Engineering Directives for AI Assistants

When modifying, generating, or refactoring code within the Qrezo v2 codebase, all AI coding assistants (Cursor, Antigravity, GitHub Copilot) MUST strictly adhere to the following rules:

### Rule 1: Respect the Pragmatic Modular Monolith Boundaries
- DO NOT create raw inter-module imports across domain boundaries.
- Cross-domain calls must interact via public service interfaces (e.g., `modules/workspace/service.ts`).
- DO NOT introduce microservice splits, external queue frameworks (Kafka/RabbitMQ), or new RPC layers unless explicitly instructed.

### Rule 2: Strict Multi-Tenant Data Isolation
- EVERY database query fetching user data MUST include `workspaceId` in its filter query.
- Never write `QRCode.find({})` or `FeedbackResponse.find({})` without scoping by `workspaceId`.

### Rule 3: Zero Code Smells & Strict Validation
- EVERY POST, PATCH, or PUT API route MUST parse incoming request bodies using Zod schemas (`ZPayload.parse(await req.json())`).
- Never write unhandled `any` types in TypeScript interfaces.
- Never leave hardcoded secret strings in source code.

---

## 2. File Placement & Naming Conventions

```
┌────────────────────────────────────────────────────────────────────────┐
│                      File Naming Standard Guidelines                   │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ Concept           │ Path Format                │ Example               │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ **Mongoose Model**│ `models/[ModelName].ts`    │ `models/Workspace.ts` │
│ **Domain Module** │ `modules/[domain]/`        │ `modules/feedback/`   │
│ **API Route**     │ `app/api/v2/[route]/`      │ `app/api/v2/feedback/`│
│ **UI Component**  │ `components/[type]/[Name]` │ `components/builder/` │
│ **Zod Schema**    │ `modules/[domain]/val.ts`  │ `modules/feedback/val`│
└───────────────────┴────────────────────────────┴───────────────────────┘
```

---

## 3. Standard Code Snippets & Templates

### Standard Next.js API Route Handler Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ZFeedbackInputSchema } from "@/modules/feedback/validation";
import { FeedbackService } from "@/modules/feedback/service";
import { AppError } from "@/core/errors/AppError";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Session required" } }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = ZFeedbackInputSchema.parse(body);

        const result = await FeedbackService.submitFeedback(validatedData, {
            ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
            userAgent: request.headers.get("user-agent") || "Unknown",
        });

        return NextResponse.json({ success: true, statusCode: 201, data: result }, { status: 201 });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
    }
}
```
