import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { updateAttendeeSchema } from "@/modules/attendee/validation";
import {
    deleteAttendee,
    getAttendee,
    updateAttendee,
} from "@/modules/attendee/service";
import { assertCanManageEvents } from "@/modules/event/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function resolveParams(params: RouteParams["params"]) {
    return params instanceof Promise ? await params : params;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const { eventId, publicId } = await resolveParams(params);
        const attendee = await getAttendee(workspaceId, eventId, publicId);
        return NextResponse.json({ success: true, data: attendee });
    } catch (error) {
        return handleApiError(error, "Get Attendee Error");
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const body = await request.json();
        const input = updateAttendeeSchema.parse(body);
        const attendee = await updateAttendee(
            workspaceId,
            eventId,
            publicId,
            input
        );
        return NextResponse.json({ success: true, data: attendee });
    } catch (error) {
        return handleApiError(error, "Update Attendee Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const result = await deleteAttendee(workspaceId, eventId, publicId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, "Delete Attendee Error");
    }
}
