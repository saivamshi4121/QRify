import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { updateWebhookEndpointSchema } from "@/modules/webhooks/validation";
import {
    updateWebhookEndpoint,
    deleteWebhookEndpoint,
    getWebhookEndpoint,
} from "@/modules/webhooks";

type RouteParams = {
    params: Promise<{ webhookId: string }> | { webhookId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.webhookId;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await getWebhookEndpoint(workspaceId, await id(params));
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Get Webhook Error");
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const input = updateWebhookEndpointSchema.parse(body);
        const data = await updateWebhookEndpoint({
            workspaceId,
            publicId: await id(params),
            ...input,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Update Webhook Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await deleteWebhookEndpoint(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Delete Webhook Error");
    }
}
