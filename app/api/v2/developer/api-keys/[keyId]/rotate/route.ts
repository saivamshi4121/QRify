import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { rotateApiKey } from "@/modules/api-key/service";

type RouteParams = {
    params: Promise<{ keyId: string }> | { keyId: string };
};

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const resolved = params instanceof Promise ? await params : params;
        const data = await rotateApiKey(
            workspaceId,
            resolved.keyId,
            userId
        );
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Rotate API Key Error");
    }
}
