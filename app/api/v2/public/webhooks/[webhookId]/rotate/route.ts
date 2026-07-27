import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { rotateWebhookSecret } from "@/modules/webhooks";

type RouteParams = {
    params: Promise<{ webhookId: string }> | { webhookId: string };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_WRITE, async (ctx) => {
        const resolved = params instanceof Promise ? await params : params;
        return publicOk(
            await rotateWebhookSecret(ctx.workspaceId, resolved.webhookId)
        );
    });
}
