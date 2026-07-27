import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { bulkDeleteAttendeesSchema } from "@/modules/attendee/validation";
import { deleteAttendeesBulk } from "@/modules/attendee/service";
import { assertCanManageEvents } from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const body = await request.json();
        const input = bulkDeleteAttendeesSchema.parse(body);
        const data = await deleteAttendeesBulk(
            workspaceId,
            eventId,
            input.publicIds
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Bulk Delete Attendees Error");
    }
}
