import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { listAccessEventsQuerySchema } from "@/modules/access-event/validation";
import { listAccessEvents } from "@/modules/access-event/service";

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
        const query = listAccessEventsQuerySchema.parse({
            q: url.searchParams.get("q") || undefined,
            gate: url.searchParams.get("gate") || undefined,
            result: url.searchParams.get("result") || undefined,
            type: url.searchParams.get("type") || undefined,
            attendeePublicId:
                url.searchParams.get("attendeePublicId") || undefined,
            page: url.searchParams.get("page") || undefined,
            limit: url.searchParams.get("limit") || undefined,
        });
        const data = await listAccessEvents(workspaceId, eventId, query);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "List Access Events Error");
    }
}
