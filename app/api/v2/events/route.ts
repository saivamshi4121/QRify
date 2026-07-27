import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import {
    createEventSchema,
    listEventsQuerySchema,
} from "@/modules/event/validation";
import {
    assertCanManageEvents,
    createEvent,
    listEvents,
} from "@/modules/event/service";

export async function GET(request: NextRequest) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const url = new URL(request.url);
        const query = listEventsQuerySchema.parse({
            q: url.searchParams.get("q") || undefined,
            status: url.searchParams.get("status") || undefined,
            sort: url.searchParams.get("sort") || undefined,
        });
        const events = await listEvents(workspaceId, query);
        return NextResponse.json({ success: true, data: events });
    } catch (error) {
        return handleApiError(error, "List Events Error");
    }
}

export async function POST(request: Request) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const body = await request.json();
        const input = createEventSchema.parse(body);
        const event = await createEvent(workspaceId, userId, input);
        return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create Event Error");
    }
}
