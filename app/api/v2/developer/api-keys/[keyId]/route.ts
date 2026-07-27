import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { updateApiKeySchema } from "@/modules/api-key/validation";
import {
    renameApiKey,
    revokeApiKey,
} from "@/modules/api-key/service";

type RouteParams = {
    params: Promise<{ keyId: string }> | { keyId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.keyId;
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const keyId = await id(params);
        const body = await request.json();
        const input = updateApiKeySchema.parse(body);
        const data = await renameApiKey({
            workspaceId,
            publicId: keyId,
            name: input.name,
            description: input.description,
            permissions: input.permissions,
            expiresAt: input.expiresAt,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Update API Key Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const keyId = await id(params);
        const data = await revokeApiKey(workspaceId, keyId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Revoke API Key Error");
    }
}
