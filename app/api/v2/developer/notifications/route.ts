import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import {
    createNotificationTemplateSchema,
    listNotificationDeliveriesQuerySchema,
    previewNotificationSchema,
    testSendSchema,
} from "@/modules/notifications/validation";
import {
    createNotificationTemplate,
    listNotificationTemplates,
    ensureStarterTemplates,
    listNotificationDeliveries,
    previewNotification,
    sendTestNotification,
    processDueNotificationRetries,
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    TEMPLATE_VARIABLES,
} from "@/modules/notifications";

export async function GET(request: NextRequest) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const url = new URL(request.url);

        if (url.searchParams.get("seed") === "1") {
            const created = await ensureStarterTemplates({
                workspaceId,
                userId,
            });
            return NextResponse.json({ success: true, data: { created } });
        }

        if (url.searchParams.get("meta") === "1") {
            return NextResponse.json({
                success: true,
                data: {
                    channels: NOTIFICATION_CHANNEL_VALUES,
                    triggerEvents: NOTIFICATION_TRIGGER_EVENT_VALUES,
                    variables: TEMPLATE_VARIABLES,
                },
            });
        }

        if (url.searchParams.get("deliveries") === "1") {
            void processDueNotificationRetries().catch(() => undefined);
            const query = listNotificationDeliveriesQuerySchema.parse({
                templateId: url.searchParams.get("templateId") || undefined,
                channel: url.searchParams.get("channel") || undefined,
                status: url.searchParams.get("status") || undefined,
                triggerEvent: url.searchParams.get("triggerEvent") || undefined,
                q: url.searchParams.get("q") || undefined,
                page: url.searchParams.get("page") || undefined,
                limit: url.searchParams.get("limit") || undefined,
            });
            const data = await listNotificationDeliveries({
                workspaceId,
                ...query,
            });
            return NextResponse.json({ success: true, data });
        }

        // Auto-seed starters when empty
        let templates = await listNotificationTemplates(workspaceId);
        if (templates.length === 0) {
            await ensureStarterTemplates({ workspaceId, userId });
            templates = await listNotificationTemplates(workspaceId);
        }

        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        return handleApiError(error, "List Notifications Error");
    }
}

export async function POST(request: Request) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const action = body.action as string | undefined;

        if (action === "preview") {
            const input = previewNotificationSchema.parse(body);
            return NextResponse.json({
                success: true,
                data: previewNotification(input),
            });
        }

        if (action === "test") {
            const input = testSendSchema.parse(body);
            const data = await sendTestNotification({
                workspaceId,
                templateId: input.templateId,
                recipient: input.recipient,
                variables: input.variables,
            });
            return NextResponse.json({ success: true, data }, { status: 201 });
        }

        const input = createNotificationTemplateSchema.parse(body);
        const data = await createNotificationTemplate({
            workspaceId,
            userId,
            ...input,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create Notification Error");
    }
}
