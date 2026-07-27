import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { rotateWebhookSecret } from "@/modules/webhooks";

type RouteParams = {
    params: Promise<{ webhookId: string }> | { webhookId: string };
};

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const resolved = params instanceof Promise ? await params : params;
        const data = await rotateWebhookSecret(
            workspaceId,
            resolved.webhookId
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Rotate Webhook Secret Error");
    }
}
