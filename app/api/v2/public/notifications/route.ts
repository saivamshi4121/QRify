import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import {
    createNotificationTemplateSchema,
    listNotificationDeliveriesQuerySchema,
    previewNotificationSchema,
    testSendSchema,
} from "@/modules/notifications/validation";
import {
    createNotificationTemplate,
    listNotificationTemplates,
    listNotificationDeliveries,
    previewNotification,
    sendTestNotification,
    processDueNotificationRetries,
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    TEMPLATE_VARIABLES,
} from "@/modules/notifications";

export async function GET(request: NextRequest) {
    return withApiKey(
        request,
        ApiKeyScope.NOTIFICATIONS_READ,
        async (ctx) => {
            const url = new URL(request.url);
            if (url.searchParams.get("meta") === "1") {
                return publicOk({
                    channels: NOTIFICATION_CHANNEL_VALUES,
                    triggerEvents: NOTIFICATION_TRIGGER_EVENT_VALUES,
                    variables: TEMPLATE_VARIABLES,
                });
            }
            if (url.searchParams.get("deliveries") === "1") {
                void processDueNotificationRetries().catch(() => undefined);
                const query = listNotificationDeliveriesQuerySchema.parse({
                    templateId:
                        url.searchParams.get("templateId") || undefined,
                    channel: url.searchParams.get("channel") || undefined,
                    status: url.searchParams.get("status") || undefined,
                    triggerEvent:
                        url.searchParams.get("triggerEvent") || undefined,
                    q: url.searchParams.get("q") || undefined,
                    page: url.searchParams.get("page") || undefined,
                    limit: url.searchParams.get("limit") || undefined,
                });
                return publicOk(
                    await listNotificationDeliveries({
                        workspaceId: ctx.workspaceId,
                        ...query,
                    })
                );
            }
            return publicOk(
                await listNotificationTemplates(ctx.workspaceId)
            );
        }
    );
}

export async function POST(request: NextRequest) {
    return withApiKey(
        request,
        ApiKeyScope.NOTIFICATIONS_WRITE,
        async (ctx) => {
            const body = await request.json();
            const action = body.action as string | undefined;

            if (action === "preview") {
                const input = previewNotificationSchema.parse(body);
                return publicOk(previewNotification(input));
            }

            if (action === "test") {
                const input = testSendSchema.parse(body);
                return publicOk(
                    await sendTestNotification({
                        workspaceId: ctx.workspaceId,
                        templateId: input.templateId,
                        recipient: input.recipient,
                        variables: input.variables,
                    }),
                    201
                );
            }

            const input = createNotificationTemplateSchema.parse(body);
            return publicOk(
                await createNotificationTemplate({
                    workspaceId: ctx.workspaceId,
                    userId: ctx.createdByUserId,
                    ...input,
                }),
                201
            );
        }
    );
}
