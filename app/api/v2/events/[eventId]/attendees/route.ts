import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import {
    createAttendeeSchema,
    listAttendeesQuerySchema,
} from "@/modules/attendee/validation";
import {
    createAttendee,
    listAttendees,
} from "@/modules/attendee/service";
import { assertCanManageEvents } from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const eventId = await resolveEventId(params);
        const url = new URL(request.url);
        const query = listAttendeesQuerySchema.parse({
            q: url.searchParams.get("q") || undefined,
            status: url.searchParams.get("status") || undefined,
            source: url.searchParams.get("source") || undefined,
            ticketType: url.searchParams.get("ticketType") || undefined,
            sort: url.searchParams.get("sort") || undefined,
            page: url.searchParams.get("page") || undefined,
            limit: url.searchParams.get("limit") || undefined,
        });
        const data = await listAttendees(workspaceId, eventId, query);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "List Attendees Error");
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const body = await request.json();
        const input = createAttendeeSchema.parse(body);
        const attendee = await createAttendee(workspaceId, eventId, input);
        return NextResponse.json(
            { success: true, data: attendee },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error, "Create Attendee Error");
    }
}
