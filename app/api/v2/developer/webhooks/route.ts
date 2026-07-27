import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
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
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const url = new URL(request.url);

        if (url.searchParams.get("meta") === "1") {
            return NextResponse.json({
                success: true,
                data: {
                    eventTypes: listSupportedEventTypes(),
                    integrations: listIntegrationTemplates(),
                },
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
            const data = await listWebhookDeliveries({
                workspaceId,
                ...query,
            });
            return NextResponse.json({ success: true, data });
        }

        const endpoints = await listWebhookEndpoints(workspaceId);
        return NextResponse.json({ success: true, data: endpoints });
    } catch (error) {
        return handleApiError(error, "List Webhooks Error");
    }
}

export async function POST(request: Request) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const input = createWebhookEndpointSchema.parse(body);
        const data = await createWebhookEndpoint({
            workspaceId,
            userId,
            name: input.name,
            description: input.description,
            url: input.url,
            enabled: input.enabled,
            eventTypes: input.eventTypes,
            retryPolicy: input.retryPolicy,
            timeoutMs: input.timeoutMs,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create Webhook Error");
    }
}
