import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import {
    assertCanManageEvents,
    archiveEvent,
} from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const event = await archiveEvent(eventId, workspaceId);
        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        return handleApiError(error, "Archive Event Error");
    }
}
