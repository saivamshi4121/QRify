import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { publicEvent } from "@/modules/api-key/publicSerializers";
import { updateEventSchema } from "@/modules/event/validation";
import {
    deleteEvent,
    getEventForWorkspace,
    updateEvent,
} from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.eventId;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.EVENTS_READ, async (ctx) => {
        const eventId = await id(params);
        const event = await getEventForWorkspace(eventId, ctx.workspaceId);
        return publicOk(publicEvent(event as Record<string, unknown>));
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.EVENTS_WRITE, async (ctx) => {
        const eventId = await id(params);
        const body = await request.json();
        const input = updateEventSchema.parse(body);
        const event = await updateEvent(eventId, ctx.workspaceId, input);
        return publicOk(publicEvent(event.toObject()));
    });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.EVENTS_WRITE, async (ctx) => {
        const eventId = await id(params);
        await deleteEvent(eventId, ctx.workspaceId);
        return publicOk({ deleted: true });
    });
}
