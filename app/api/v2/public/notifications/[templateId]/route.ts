import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { updateNotificationTemplateSchema } from "@/modules/notifications/validation";
import {
    getNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
} from "@/modules/notifications";

type RouteParams = {
    params: Promise<{ templateId: string }> | { templateId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.templateId;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.NOTIFICATIONS_READ, async (ctx) => {
        return publicOk(
            await getNotificationTemplate(ctx.workspaceId, await id(params))
        );
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    return withApiKey(
        request,
        ApiKeyScope.NOTIFICATIONS_WRITE,
        async (ctx) => {
            const body = await request.json();
            const input = updateNotificationTemplateSchema.parse(body);
            return publicOk(
                await updateNotificationTemplate({
                    workspaceId: ctx.workspaceId,
                    publicId: await id(params),
                    ...input,
                })
            );
        }
    );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return withApiKey(
        request,
        ApiKeyScope.NOTIFICATIONS_WRITE,
        async (ctx) => {
            return publicOk(
                await deleteNotificationTemplate(
                    ctx.workspaceId,
                    await id(params)
                )
            );
        }
    );
}
