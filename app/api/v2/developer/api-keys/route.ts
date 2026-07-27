import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { createApiKeySchema } from "@/modules/api-key/validation";
import {
    createApiKey,
    listApiKeys,
    listApiRequestLogs,
} from "@/modules/api-key/service";

export async function GET(request: NextRequest) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const url = new URL(request.url);
        if (url.searchParams.get("logs") === "1") {
            const logs = await listApiRequestLogs(
                workspaceId,
                Number(url.searchParams.get("limit") || 50)
            );
            return NextResponse.json({ success: true, data: logs });
        }
        const keys = await listApiKeys(workspaceId);
        return NextResponse.json({ success: true, data: keys });
    } catch (error) {
        return handleApiError(error, "List API Keys Error");
    }
}

export async function POST(request: Request) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const input = createApiKeySchema.parse(body);
        const data = await createApiKey({
            workspaceId,
            userId,
            name: input.name,
            description: input.description,
            environment: input.environment,
            permissions: input.permissions,
            expiresAt: input.expiresAt ?? null,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create API Key Error");
    }
}
