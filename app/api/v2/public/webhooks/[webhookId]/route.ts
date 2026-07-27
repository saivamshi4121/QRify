import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
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

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_READ, async (ctx) => {
        return publicOk(
            await getWebhookEndpoint(ctx.workspaceId, await id(params))
        );
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_WRITE, async (ctx) => {
        const body = await request.json();
        const input = updateWebhookEndpointSchema.parse(body);
        return publicOk(
            await updateWebhookEndpoint({
                workspaceId: ctx.workspaceId,
                publicId: await id(params),
                ...input,
            })
        );
    });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_WRITE, async (ctx) => {
        return publicOk(
            await deleteWebhookEndpoint(ctx.workspaceId, await id(params))
        );
    });
}
