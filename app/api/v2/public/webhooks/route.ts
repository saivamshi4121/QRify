import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import {
    createWebhookEndpointSchema,
    listDeliveriesQuerySchema,
} from "@/modules/webhooks/validation";
import {
    createWebhookEndpoint,
    listWebhookEndpoints,
    listWebhookDeliveries,
    listSupportedEventTypes,
    listIntegrationTemplates,
    processDueRetries,
} from "@/modules/webhooks";

export async function GET(request: NextRequest) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_READ, async (ctx) => {
        const url = new URL(request.url);
        if (url.searchParams.get("meta") === "1") {
            return publicOk({
                eventTypes: listSupportedEventTypes(),
                integrations: listIntegrationTemplates(),
            });
        }
        if (url.searchParams.get("deliveries") === "1") {
            void processDueRetries().catch(() => undefined);
            const query = listDeliveriesQuerySchema.parse({
                webhookId: url.searchParams.get("webhookId") || undefined,
                eventType: url.searchParams.get("eventType") || undefined,
                status: url.searchParams.get("status") || undefined,
                q: url.searchParams.get("q") || undefined,
                page: url.searchParams.get("page") || undefined,
                limit: url.searchParams.get("limit") || undefined,
            });
            return publicOk(
                await listWebhookDeliveries({
                    workspaceId: ctx.workspaceId,
                    ...query,
                })
            );
        }
        return publicOk(await listWebhookEndpoints(ctx.workspaceId));
    });
}

export async function POST(request: NextRequest) {
    return withApiKey(request, ApiKeyScope.WEBHOOKS_WRITE, async (ctx) => {
        const body = await request.json();
        const input = createWebhookEndpointSchema.parse(body);
        const data = await createWebhookEndpoint({
            workspaceId: ctx.workspaceId,
            userId: ctx.createdByUserId,
            name: input.name,
            description: input.description,
            url: input.url,
            enabled: input.enabled,
            eventTypes: input.eventTypes,
            retryPolicy: input.retryPolicy,
            timeoutMs: input.timeoutMs,
        });
        return publicOk(data, 201);
    });
}
