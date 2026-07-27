import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
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

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await getNotificationTemplate(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Get Notification Template Error");
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const input = updateNotificationTemplateSchema.parse(body);
        const data = await updateNotificationTemplate({
            workspaceId,
            publicId: await id(params),
            ...input,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Update Notification Template Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await deleteNotificationTemplate(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Delete Notification Template Error");
    }
}
