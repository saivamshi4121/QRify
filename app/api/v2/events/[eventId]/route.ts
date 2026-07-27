import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { updateEventSchema } from "@/modules/event/validation";
import {
    assertCanManageEvents,
    deleteEvent,
    getEventForWorkspace,
    updateEvent,
} from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const eventId = await resolveEventId(params);
        const event = await getEventForWorkspace(eventId, workspaceId);
        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        return handleApiError(error, "Get Event Error");
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const body = await request.json();
        const input = updateEventSchema.parse(body);
        const event = await updateEvent(eventId, workspaceId, input);
        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        return handleApiError(error, "Update Event Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const result = await deleteEvent(eventId, workspaceId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, "Delete Event Error");
    }
}
